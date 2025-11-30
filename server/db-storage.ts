import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import {
  contracts,
  compilations,
  deployments,
  securityAnalyses,
  stakingPositions,
  bridgeTransactions,
  activities,
  walletConnections,
  type Contract,
  type InsertContract,
  type Compilation,
  type InsertCompilation,
  type Deployment,
  type InsertDeployment,
  type SecurityAnalysis,
  type InsertSecurityAnalysis,
  type StakingPosition,
  type InsertStakingPosition,
  type BridgeTransaction,
  type InsertBridgeTransaction,
  type Activity,
  type InsertActivity,
  type WalletConnection,
} from "@shared/db-schema";

export interface DashboardStats {
  contractsDeployed: number;
  totalGasUsed: number;
  successRate: number;
  networkStatus: "online" | "degraded" | "offline";
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    status: string;
    timestamp: string;
  }>;
}

export interface CompilationMetrics {
  totalCompilations: number;
  successfulCompilations: number;
  failedCompilations: number;
  averageCompilationTime: number;
  successRate: number;
}

export class DbStorage {
  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async getContracts(): Promise<Contract[]> {
    return db.select().from(contracts).orderBy(desc(contracts.createdAt));
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    return newContract;
  }

  async updateContract(id: number, updates: Partial<InsertContract>): Promise<Contract | undefined> {
    const [updated] = await db.update(contracts).set(updates).where(eq(contracts.id, id)).returning();
    return updated;
  }

  async saveCompilation(compilation: InsertCompilation): Promise<Compilation> {
    const [newCompilation] = await db.insert(compilations).values(compilation).returning();
    return newCompilation;
  }

  async getCompilations(): Promise<Compilation[]> {
    return db.select().from(compilations).orderBy(desc(compilations.createdAt));
  }

  async getDeployment(id: number): Promise<Deployment | undefined> {
    const [deployment] = await db.select().from(deployments).where(eq(deployments.id, id));
    return deployment;
  }

  async getDeploymentByHash(deployHash: string): Promise<Deployment | undefined> {
    const [deployment] = await db.select().from(deployments).where(eq(deployments.deployHash, deployHash));
    return deployment;
  }

  async getDeployments(): Promise<Deployment[]> {
    return db.select().from(deployments).orderBy(desc(deployments.createdAt));
  }

  async getDeploymentsByUser(publicKeyHex: string): Promise<Deployment[]> {
    return db.select().from(deployments)
      .where(eq(deployments.userPublicKey, publicKeyHex))
      .orderBy(desc(deployments.createdAt));
  }

  async createDeployment(deployment: InsertDeployment): Promise<Deployment> {
    const [newDeployment] = await db.insert(deployments).values(deployment).returning();
    return newDeployment;
  }

  async updateDeployment(id: number, updates: Partial<InsertDeployment>): Promise<Deployment | undefined> {
    const [updated] = await db.update(deployments).set(updates).where(eq(deployments.id, id)).returning();
    return updated;
  }

  async getSecurityAnalysis(contractId: string): Promise<SecurityAnalysis | undefined> {
    const [analysis] = await db.select().from(securityAnalyses).where(eq(securityAnalyses.contractId, contractId));
    return analysis;
  }

  async getRecentSecurityAnalyses(): Promise<SecurityAnalysis[]> {
    return db.select().from(securityAnalyses).orderBy(desc(securityAnalyses.analyzedAt)).limit(10);
  }

  async saveSecurityAnalysis(analysis: InsertSecurityAnalysis): Promise<SecurityAnalysis> {
    const [newAnalysis] = await db.insert(securityAnalyses).values(analysis).returning();
    return newAnalysis;
  }

  async getStakingPosition(id: number): Promise<StakingPosition | undefined> {
    const [position] = await db.select().from(stakingPositions).where(eq(stakingPositions.id, id));
    return position;
  }

  async getStakingPositions(): Promise<StakingPosition[]> {
    return db.select().from(stakingPositions).orderBy(desc(stakingPositions.startDate));
  }

  async getStakingPositionsByUser(publicKeyHex: string): Promise<StakingPosition[]> {
    return db.select().from(stakingPositions)
      .where(eq(stakingPositions.userPublicKey, publicKeyHex))
      .orderBy(desc(stakingPositions.startDate));
  }

  async createStakingPosition(position: InsertStakingPosition): Promise<StakingPosition> {
    const [newPosition] = await db.insert(stakingPositions).values(position).returning();
    return newPosition;
  }

  async updateStakingPosition(id: number, updates: Partial<InsertStakingPosition>): Promise<StakingPosition | undefined> {
    const [updated] = await db.update(stakingPositions).set(updates).where(eq(stakingPositions.id, id)).returning();
    return updated;
  }

  async getBridgeTransaction(id: number): Promise<BridgeTransaction | undefined> {
    const [tx] = await db.select().from(bridgeTransactions).where(eq(bridgeTransactions.id, id));
    return tx;
  }

  async getBridgeTransactions(): Promise<BridgeTransaction[]> {
    return db.select().from(bridgeTransactions).orderBy(desc(bridgeTransactions.createdAt));
  }

  async getBridgeTransactionsByUser(publicKeyHex: string): Promise<BridgeTransaction[]> {
    return db.select().from(bridgeTransactions)
      .where(eq(bridgeTransactions.userPublicKey, publicKeyHex))
      .orderBy(desc(bridgeTransactions.createdAt));
  }

  async createBridgeTransaction(tx: InsertBridgeTransaction): Promise<BridgeTransaction> {
    const [newTx] = await db.insert(bridgeTransactions).values(tx).returning();
    return newTx;
  }

  async updateBridgeTransaction(id: number, updates: Partial<InsertBridgeTransaction>): Promise<BridgeTransaction | undefined> {
    const [updated] = await db.update(bridgeTransactions).set(updates).where(eq(bridgeTransactions.id, id)).returning();
    return updated;
  }

  async addActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async getRecentActivities(limit = 10): Promise<Activity[]> {
    return db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
  }

  async getWalletConnection(publicKey: string): Promise<WalletConnection | undefined> {
    const [connection] = await db.select().from(walletConnections).where(eq(walletConnections.publicKey, publicKey));
    return connection;
  }

  async saveWalletConnection(
    publicKey: string, 
    address: string, 
    networkId: string,
    balance?: string,
    balanceCSPR?: number
  ): Promise<WalletConnection> {
    const existing = await db.select().from(walletConnections).where(eq(walletConnections.publicKey, publicKey));
    
    if (existing.length > 0) {
      const [updated] = await db.update(walletConnections)
        .set({ 
          lastConnected: new Date(),
          balance: balance || existing[0].balance,
          balanceCSPR: balanceCSPR ?? existing[0].balanceCSPR,
          accountHash: address,
        })
        .where(eq(walletConnections.publicKey, publicKey))
        .returning();
      return updated;
    }
    
    const [newConnection] = await db.insert(walletConnections).values({
      publicKey,
      address,
      accountHash: address,
      networkId,
      balance,
      balanceCSPR,
    }).returning();
    
    return newConnection;
  }

  async removeWalletConnection(publicKey: string): Promise<void> {
    await db.delete(walletConnections).where(eq(walletConnections.publicKey, publicKey));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const allDeployments = await this.getDeployments();
    const successfulDeployments = allDeployments.filter((d) => d.status === "confirmed");
    const totalGasUsed = successfulDeployments.reduce((sum, d) => sum + (d.gasUsed || 0), 0);
    
    const allCompilations = await this.getCompilations();
    const successfulCompilations = allCompilations.filter((c) => c.success);
    
    const recentActivitiesData = await this.getRecentActivities(5);
    const recentActivity = recentActivitiesData.map((a) => ({
      id: a.id.toString(),
      type: a.type,
      description: a.description,
      status: a.status,
      timestamp: a.createdAt.toISOString(),
    }));

    return {
      contractsDeployed: successfulDeployments.length,
      totalGasUsed,
      successRate: allCompilations.length > 0 
        ? (successfulCompilations.length / allCompilations.length) * 100 
        : 0,
      networkStatus: "online",
      recentActivity,
    };
  }

  async getCompilationMetrics(): Promise<CompilationMetrics> {
    const allCompilations = await this.getCompilations();
    const successfulCompilations = allCompilations.filter((c) => c.success);
    const totalTime = allCompilations.reduce((sum, c) => sum + (c.compilationTime || 0), 0);

    return {
      totalCompilations: allCompilations.length,
      successfulCompilations: successfulCompilations.length,
      failedCompilations: allCompilations.length - successfulCompilations.length,
      averageCompilationTime: allCompilations.length > 0 
        ? Math.round(totalTime / allCompilations.length) 
        : 0,
      successRate: allCompilations.length > 0
        ? (successfulCompilations.length / allCompilations.length) * 100
        : 0,
    };
  }
}

export const dbStorage = new DbStorage();
