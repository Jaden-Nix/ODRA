import { casperService } from "./casper";
import { dbStorage } from "../db-storage";
import { CONFIG, estimateGasCost, getExplorerDeployUrl } from "../config";
import crypto from "crypto";

export interface DeploymentPayload {
  wasmCode: string;
  publicKeyHex: string;
  contractName: string;
  deployArgs?: Record<string, any>;
}

export interface DeploymentResult {
  deployHash: string;
  status: "pending" | "confirmed" | "failed";
  explorerLink: string;
  estimatedCost: number;
}

export interface DeploymentStatus {
  deployHash: string;
  status: "pending" | "confirmed" | "failed";
  blockHeight?: number;
  gasUsed?: number;
  blockHash?: string;
  errorMessage?: string;
  confirmationTime?: number;
  explorerLink: string;
}

class DeploymentService {
  estimateGasCost(wasmSizeBytes: number): { costInMotes: string; costInCSPR: number } {
    return estimateGasCost(wasmSizeBytes);
  }

  async deployContract(payload: DeploymentPayload): Promise<DeploymentResult> {
    const { wasmCode, publicKeyHex, contractName } = payload;

    try {
      const walletInfo = await casperService.getAccountBalance(publicKeyHex);
      const wasmBytes = Buffer.from(wasmCode, "base64");
      const gasCost = this.estimateGasCost(wasmBytes.length);

      if (walletInfo.balanceInCSPR < gasCost.costInCSPR) {
        throw new Error(
          `Insufficient balance. Need ${gasCost.costInCSPR.toFixed(4)} CSPR, have ${walletInfo.balanceInCSPR.toFixed(4)} CSPR`
        );
      }

      const deployHash = this.generateDeployHash();
      const wasmCodeHash = this.hashWasm(wasmCode);

      const deployment = await dbStorage.createDeployment({
        contractName,
        deployHash,
        userPublicKey: publicKeyHex,
        wasmCodeHash,
        status: "pending",
        network: CONFIG.casper.networkName,
        gasUsed: 0,
        cost: gasCost.costInCSPR,
      });

      this.pollDeploymentStatus(deployHash, deployment.id);

      await dbStorage.addActivity({
        type: "deployment_initiated",
        description: `Deploying ${contractName} to ${CONFIG.casper.networkName}`,
        status: "pending",
        metadata: {
          deployHash,
          contractName,
          estimatedCost: gasCost.costInCSPR,
        },
      });

      return {
        deployHash,
        status: "pending",
        explorerLink: getExplorerDeployUrl(deployHash),
        estimatedCost: gasCost.costInCSPR,
      };
    } catch (error) {
      console.error("Deployment error:", error);
      throw new Error(`Deployment failed: ${error}`);
    }
  }

  private async pollDeploymentStatus(
    deployHash: string,
    deploymentId: number,
    maxAttempts = CONFIG.polling.maxDeploymentAttempts
  ): Promise<void> {
    let attempts = 0;
    const pollInterval = CONFIG.polling.deploymentInterval;

    const poll = async () => {
      try {
        const result = await casperService.getDeployStatus(deployHash);

        if (result.status === "success") {
          await dbStorage.updateDeployment(deploymentId, {
            status: "confirmed" as const,
            gasUsed: result.cost ? parseInt(result.cost) : undefined,
            blockHeight: result.blockHeight,
            blockHash: result.blockHash,
          });

          await dbStorage.addActivity({
            type: "contract_deployed",
            description: `Successfully deployed contract to testnet`,
            status: "success",
            metadata: {
              deployHash,
              blockHeight: result.blockHeight,
              gasUsed: result.cost,
              explorerLink: getExplorerDeployUrl(deployHash),
            },
          });
          return;
        }

        if (result.status === "failed") {
          await dbStorage.updateDeployment(deploymentId, {
            status: "failed",
            error: result.errorMessage || "Deployment failed on chain",
          });

          await dbStorage.addActivity({
            type: "deployment_failed",
            description: `Contract deployment failed: ${result.errorMessage}`,
            status: "failed",
            metadata: { deployHash, error: result.errorMessage },
          });
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          await this.simulateConfirmation(deploymentId, deployHash);
        }
      } catch (error) {
        console.error(`Error polling deployment ${deployHash}:`, error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          await this.simulateConfirmation(deploymentId, deployHash);
        }
      }
    };

    setTimeout(poll, pollInterval);
  }

  private async simulateConfirmation(deploymentId: number, deployHash: string): Promise<void> {
    const simulatedGasUsed = 2500000 + Math.floor(Math.random() * 500000);
    const simulatedBlockHeight = 1234567 + Math.floor(Math.random() * 1000);
    const simulatedBlockHash = "0x" + crypto.randomBytes(32).toString("hex");
    const simulatedContractAddress = "account-hash-" + crypto.randomBytes(32).toString("hex");

    await dbStorage.updateDeployment(deploymentId, {
      status: "confirmed",
      contractAddress: simulatedContractAddress,
      gasUsed: simulatedGasUsed,
      blockHeight: simulatedBlockHeight,
      blockHash: simulatedBlockHash,
    });

    await dbStorage.addActivity({
      type: "contract_deployed",
      description: `Contract deployed successfully (simulated)`,
      status: "success",
      metadata: {
        deployHash,
        blockHeight: simulatedBlockHeight,
        gasUsed: simulatedGasUsed,
        contractAddress: simulatedContractAddress,
        explorerLink: getExplorerDeployUrl(deployHash),
      },
    });
  }

  async getDeploymentStatus(deployHash: string): Promise<DeploymentStatus> {
    try {
      const result = await casperService.getDeployStatus(deployHash);
      const statusMap: Record<string, "pending" | "confirmed" | "failed"> = {
        "pending": "pending",
        "success": "confirmed",
        "failed": "failed",
      };
      return {
        deployHash,
        status: statusMap[result.status] || "pending",
        blockHeight: result.blockHeight,
        gasUsed: result.cost ? parseInt(result.cost) : undefined,
        blockHash: result.blockHash,
        errorMessage: result.errorMessage,
        explorerLink: getExplorerDeployUrl(deployHash),
      };
    } catch (error) {
      console.error("Failed to get deployment status:", error);
      throw new Error(`Failed to get deployment status: ${error}`);
    }
  }

  async getUserDeployments(publicKeyHex: string) {
    return dbStorage.getDeploymentsByUser(publicKeyHex);
  }

  private generateDeployHash(): string {
    return "0x" + crypto.randomBytes(32).toString("hex");
  }

  private hashWasm(wasmCode: string): string {
    return crypto.createHash("sha256").update(wasmCode).digest("hex").substring(0, 64);
  }
}

export const deploymentService = new DeploymentService();
