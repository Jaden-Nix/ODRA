import { ethers } from "ethers";
import { casperService } from "./casper";
import { dbStorage } from "../db-storage";
import { CONFIG } from "../config";
import crypto from "crypto";

export interface BridgeTransfer {
  id: string;
  sourceChain: "casper-test" | "sepolia";
  destChain: "casper-test" | "sepolia";
  amount: number;
  token: string;
  fee: number;
  sourceTxHash?: string;
  destTxHash?: string;
  status: "initiated" | "locked" | "released" | "completed" | "failed";
  startTime: Date;
  completionTime?: Date;
  errorMessage?: string;
}

export interface BridgeFeeEstimate {
  fee: number;
  feePercentage: number;
  totalCost: number;
  estimatedTime: string;
}

export interface BridgeStats {
  totalTransfers: number;
  totalVolumeCSPR: number;
  completedTransfers: number;
  failedTransfers: number;
  pendingTransfers: number;
  avgCompletionTime: number;
}

class BridgeService {
  estimateBridgeFee(amount: number, sourceChain: string): BridgeFeeEstimate {
    const feePercentage = sourceChain === "casper-test" 
      ? CONFIG.bridge.feeCasperToEth 
      : CONFIG.bridge.feeEthToCasper;
    
    // FIXED: Use BigInt to prevent floating-point precision loss
    const feeBasisPoints = Math.floor(feePercentage * 100); // Convert to basis points
    const amountInSmallestUnit = Math.floor(amount * 1_000_000); // Scale up
    const feeInSmallestUnit = (BigInt(amountInSmallestUnit) * BigInt(feeBasisPoints)) / BigInt(1_000_000);
    const fee = Number(feeInSmallestUnit) / 1_000_000; // Scale back down
    const totalCost = amount + fee;
    
    const estimatedTime = sourceChain === "casper-test" 
      ? "15-30 minutes" 
      : "20-40 minutes";

    return {
      fee: Math.round(fee * 1_000_000) / 1_000_000, // Round to 6 decimals
      feePercentage,
      totalCost: Math.round(totalCost * 1_000_000) / 1_000_000,
      estimatedTime,
    };
  }

  validateBridgeAmount(amount: number): { valid: boolean; error?: string } {
    if (amount < CONFIG.bridge.minBridgeAmount) {
      return { valid: false, error: `Minimum bridge amount is ${CONFIG.bridge.minBridgeAmount}` };
    }
    if (amount > CONFIG.bridge.maxBridgeAmount) {
      return { valid: false, error: `Maximum bridge amount is ${CONFIG.bridge.maxBridgeAmount}` };
    }
    return { valid: true };
  }

  async initiateTransferCasperToSepolia(payload: {
    publicKeyHex: string;
    amountCSPR: number;
    sepoliaAddress: string;
    token?: string;
  }): Promise<{ transferId: string; fee: number; status: string }> {
    const { publicKeyHex, amountCSPR, sepoliaAddress, token = "CSPR" } = payload;

    if (!ethers.isAddress(sepoliaAddress)) {
      throw new Error("Invalid Sepolia address");
    }

    const validation = this.validateBridgeAmount(amountCSPR);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const walletInfo = await casperService.getAccountBalance(publicKeyHex);
    const feeInfo = this.estimateBridgeFee(amountCSPR, "casper-test");

    if (walletInfo.balanceInCSPR < feeInfo.totalCost) {
      throw new Error(
        `Insufficient balance. Need ${feeInfo.totalCost.toFixed(4)} CSPR, have ${walletInfo.balanceInCSPR.toFixed(4)} CSPR`
      );
    }

    const sourceTxHash = "0x" + crypto.randomBytes(32).toString("hex");

    const transfer = await dbStorage.createBridgeTransaction({
      userPublicKey: publicKeyHex,
      sourceChain: "casper-test",
      destinationChain: "sepolia",
      sourceAddress: publicKeyHex,
      destinationAddress: sepoliaAddress,
      amount: amountCSPR,
      token,
      fee: feeInfo.fee,
      status: "initiated",
      txHashSource: sourceTxHash,
    });

    this.simulateBridgeTransfer(transfer.id, amountCSPR, token);

    await dbStorage.addActivity({
      type: "bridge_initiated",
      description: `Initiated bridge transfer of ${amountCSPR} ${token} to Sepolia`,
      status: "pending",
      metadata: {
        transferId: transfer.id,
        amount: amountCSPR,
        token,
        sepoliaAddress,
        fee: feeInfo.fee,
      },
    });

    return {
      transferId: transfer.id.toString(),
      fee: feeInfo.fee,
      status: "initiated",
    };
  }

  async initiateTransferSepoliaToCasper(payload: {
    sepoliaAddress: string;
    amountETH: number;
    casperPublicKey: string;
    token?: string;
  }): Promise<{ transferId: string; fee: number; status: string }> {
    const { sepoliaAddress, amountETH, casperPublicKey, token = "ETH" } = payload;

    if (!ethers.isAddress(sepoliaAddress)) {
      throw new Error("Invalid Sepolia address");
    }

    const validation = this.validateBridgeAmount(amountETH);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const feeInfo = this.estimateBridgeFee(amountETH, "sepolia");
    const sourceTxHash = "0x" + crypto.randomBytes(32).toString("hex");

    const transfer = await dbStorage.createBridgeTransaction({
      userPublicKey: casperPublicKey,
      sourceChain: "sepolia",
      destinationChain: "casper-test",
      sourceAddress: sepoliaAddress,
      destinationAddress: casperPublicKey,
      amount: amountETH,
      token,
      fee: feeInfo.fee,
      status: "initiated",
      txHashSource: sourceTxHash,
    });

    this.simulateBridgeTransfer(transfer.id, amountETH, token);

    await dbStorage.addActivity({
      type: "bridge_initiated",
      description: `Initiated bridge transfer of ${amountETH} ${token} to Casper`,
      status: "pending",
      metadata: {
        transferId: transfer.id,
        amount: amountETH,
        token,
        casperPublicKey,
        fee: feeInfo.fee,
      },
    });

    return {
      transferId: transfer.id.toString(),
      fee: feeInfo.fee,
      status: "initiated",
    };
  }

  private async simulateBridgeTransfer(transferId: number, amount: number, token: string): Promise<void> {
    const stages = [
      { status: "locked", delay: 5000, description: "Tokens locked on source chain" },
      { status: "released", delay: 15000, description: "Lock confirmed, preparing mint" },
      { status: "completed", delay: 25000, description: "Tokens minted on destination" },
    ];

    for (const stage of stages) {
      setTimeout(async () => {
        try {
          const destTxHash = stage.status === "completed" 
            ? "0x" + crypto.randomBytes(32).toString("hex")
            : undefined;

          await dbStorage.updateBridgeTransaction(transferId, {
            status: stage.status,
            txHashDestination: destTxHash,
            completedAt: stage.status === "completed" ? new Date() : undefined,
          });

          if (stage.status === "completed") {
            await dbStorage.addActivity({
              type: "bridge_completed",
              description: `Bridge transfer completed: ${amount} ${token} received`,
              status: "success",
              metadata: {
                transferId,
                amount,
                token,
                destTxHash,
              },
            });
          }
        } catch (error) {
          console.error(`Error updating bridge transfer ${transferId}:`, error);
        }
      }, stage.delay);
    }
  }

  async getBridgeTransferStatus(transferId: number): Promise<BridgeTransfer | null> {
    const transfer = await dbStorage.getBridgeTransaction(transferId);
    if (!transfer) return null;

    return {
      id: transfer.id.toString(),
      sourceChain: transfer.sourceChain as "casper-test" | "sepolia",
      destChain: transfer.destinationChain as "casper-test" | "sepolia",
      amount: transfer.amount,
      token: transfer.token,
      fee: transfer.fee || 0,
      sourceTxHash: transfer.txHashSource || undefined,
      destTxHash: transfer.txHashDestination || undefined,
      status: transfer.status as BridgeTransfer["status"],
      startTime: transfer.createdAt,
      completionTime: transfer.completedAt || undefined,
      errorMessage: transfer.errorMessage || undefined,
    };
  }

  async getUserBridgeHistory(publicKeyHex: string): Promise<BridgeTransfer[]> {
    const transfers = await dbStorage.getBridgeTransactionsByUser(publicKeyHex);
    
    return transfers.map((t) => ({
      id: t.id.toString(),
      sourceChain: t.sourceChain as "casper-test" | "sepolia",
      destChain: t.destinationChain as "casper-test" | "sepolia",
      amount: t.amount,
      token: t.token,
      fee: t.fee || 0,
      sourceTxHash: t.txHashSource || undefined,
      destTxHash: t.txHashDestination || undefined,
      status: t.status as BridgeTransfer["status"],
      startTime: t.createdAt,
      completionTime: t.completedAt || undefined,
      errorMessage: t.errorMessage || undefined,
    }));
  }

  async getBridgeStats(): Promise<BridgeStats> {
    const allTransfers = await dbStorage.getBridgeTransactions();
    
    const completedTransfers = allTransfers.filter((t) => t.status === "completed");
    const failedTransfers = allTransfers.filter((t) => t.status === "failed");
    const pendingTransfers = allTransfers.filter((t) => 
      ["initiated", "locked", "released"].includes(t.status)
    );
    
    const totalVolume = allTransfers.reduce((sum, t) => sum + t.amount, 0);
    
    const completionTimes = completedTransfers
      .filter((t) => t.completedAt)
      .map((t) => t.completedAt!.getTime() - t.createdAt.getTime());
    
    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    return {
      totalTransfers: allTransfers.length,
      totalVolumeCSPR: totalVolume,
      completedTransfers: completedTransfers.length,
      failedTransfers: failedTransfers.length,
      pendingTransfers: pendingTransfers.length,
      avgCompletionTime: Math.round(avgCompletionTime / 1000),
    };
  }

  getSupportedTokens(): string[] {
    return CONFIG.bridge.supportedTokens;
  }

  getSupportedChains(): { id: string; name: string; type: string }[] {
    return [
      { id: "casper-test", name: "Casper Testnet", type: "casper" },
      { id: "sepolia", name: "Sepolia Testnet", type: "ethereum" },
    ];
  }
}

export const bridgeService = new BridgeService();
