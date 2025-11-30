import { casperService } from "./casper";
import { dbStorage } from "../db-storage";
import { CONFIG, validatePublicKey } from "../config";

export interface WalletConnectionRequest {
  publicKeyHex: string;
  signature?: string;
}

export interface ConnectedWallet {
  publicKey: string;
  accountHash: string;
  address: string;
  balanceInCSPR: number;
  balanceInMotes: string;
  isConnected: boolean;
  connectedAt: Date;
  networkId: string;
}

class WalletService {
  validatePublicKey(publicKeyHex: string): { valid: boolean; error?: string } {
    const result = validatePublicKey(publicKeyHex);
    return { valid: result.valid, error: result.error };
  }

  async connectWallet(publicKeyHex: string): Promise<ConnectedWallet> {
    const validation = this.validatePublicKey(publicKeyHex);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid public key format");
    }

    try {
      const walletInfo = await casperService.getAccountBalance(publicKeyHex);
      
      const connection = await dbStorage.saveWalletConnection(
        publicKeyHex,
        walletInfo.accountHash,
        CONFIG.casper.networkName,
        walletInfo.balance,
        walletInfo.balanceInCSPR
      );

      await dbStorage.addActivity({
        type: "wallet_connected",
        description: `Connected wallet ${publicKeyHex.substring(0, 10)}...${publicKeyHex.substring(publicKeyHex.length - 6)}`,
        status: "success",
        metadata: { 
          publicKey: publicKeyHex,
          balance: walletInfo.balanceInCSPR,
        },
      });

      return {
        publicKey: publicKeyHex,
        accountHash: walletInfo.accountHash,
        address: walletInfo.accountHash,
        balanceInCSPR: walletInfo.balanceInCSPR,
        balanceInMotes: walletInfo.balance,
        isConnected: true,
        connectedAt: new Date(),
        networkId: CONFIG.casper.networkName,
      };
    } catch (error) {
      console.error("Wallet connection error:", error);
      throw new Error(`Failed to connect wallet: ${error}`);
    }
  }

  async disconnectWallet(publicKeyHex: string): Promise<void> {
    try {
      await dbStorage.removeWalletConnection(publicKeyHex);
      
      await dbStorage.addActivity({
        type: "wallet_disconnected",
        description: `Disconnected wallet ${publicKeyHex.substring(0, 10)}...`,
        status: "success",
        metadata: { publicKey: publicKeyHex },
      });
    } catch (error) {
      console.error("Wallet disconnection error:", error);
      throw new Error(`Failed to disconnect wallet: ${error}`);
    }
  }

  async getWalletStatus(publicKeyHex: string): Promise<ConnectedWallet | null> {
    try {
      const connection = await dbStorage.getWalletConnection(publicKeyHex);
      if (!connection) return null;

      const walletInfo = await casperService.getAccountBalance(publicKeyHex);
      
      await dbStorage.saveWalletConnection(
        publicKeyHex,
        walletInfo.accountHash,
        CONFIG.casper.networkName,
        walletInfo.balance,
        walletInfo.balanceInCSPR
      );

      return {
        publicKey: publicKeyHex,
        accountHash: connection.accountHash || walletInfo.accountHash,
        address: connection.address,
        balanceInCSPR: walletInfo.balanceInCSPR,
        balanceInMotes: walletInfo.balance,
        isConnected: true,
        connectedAt: connection.lastConnected,
        networkId: connection.networkId,
      };
    } catch (error) {
      console.error("Get wallet status error:", error);
      return null;
    }
  }

  async refreshWalletBalance(publicKeyHex: string): Promise<{ balanceInCSPR: number; balanceInMotes: string }> {
    try {
      const walletInfo = await casperService.getAccountBalance(publicKeyHex);
      
      await dbStorage.saveWalletConnection(
        publicKeyHex,
        walletInfo.accountHash,
        CONFIG.casper.networkName,
        walletInfo.balance,
        walletInfo.balanceInCSPR
      );

      return {
        balanceInCSPR: walletInfo.balanceInCSPR,
        balanceInMotes: walletInfo.balance,
      };
    } catch (error) {
      console.error("Refresh balance error:", error);
      throw new Error(`Failed to refresh balance: ${error}`);
    }
  }

  verifySignature(publicKeyHex: string, message: string, signature: string): boolean {
    try {
      if (!publicKeyHex || !message || !signature) return false;
      if (signature.length < 128) return false;
      if (!/^[a-fA-F0-9]+$/.test(signature)) return false;
      
      const keyType = publicKeyHex.substring(0, 2);
      if (keyType === "01") {
        return signature.length === 128;
      } else if (keyType === "02") {
        return signature.length >= 128 && signature.length <= 140;
      }
      return false;
    } catch {
      return false;
    }
  }

  async checkSufficientBalance(publicKeyHex: string, requiredCSPR: number): Promise<boolean> {
    try {
      const walletInfo = await casperService.getAccountBalance(publicKeyHex);
      return walletInfo.balanceInCSPR >= requiredCSPR;
    } catch {
      return false;
    }
  }
}

export const walletService = new WalletService();
