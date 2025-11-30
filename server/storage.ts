import { randomUUID } from "crypto";
import type {
  Contract,
  CompilationResult,
  Deployment,
  SecurityAnalysis,
  StakingPosition,
  BridgeTransaction,
  DashboardStats,
  CompilationMetrics,
  ActivityItem,
} from "@shared/schema";

export interface IStorage {
  // Contracts
  getContract(id: string): Promise<Contract | undefined>;
  getContracts(): Promise<Contract[]>;
  createContract(contract: Omit<Contract, "id">): Promise<Contract>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined>;

  // Compilations
  saveCompilation(result: Omit<CompilationResult, "id">): Promise<CompilationResult>;
  getCompilations(): Promise<CompilationResult[]>;

  // Deployments
  getDeployment(id: string): Promise<Deployment | undefined>;
  getDeployments(): Promise<Deployment[]>;
  createDeployment(deployment: Omit<Deployment, "id">): Promise<Deployment>;
  updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment | undefined>;

  // Security Analysis
  getSecurityAnalysis(contractId: string): Promise<SecurityAnalysis | undefined>;
  getRecentSecurityAnalyses(): Promise<SecurityAnalysis[]>;
  saveSecurityAnalysis(analysis: Omit<SecurityAnalysis, "id">): Promise<SecurityAnalysis>;

  // Staking
  getStakingPositions(): Promise<StakingPosition[]>;
  createStakingPosition(position: Omit<StakingPosition, "id">): Promise<StakingPosition>;
  updateStakingPosition(id: string, updates: Partial<StakingPosition>): Promise<StakingPosition | undefined>;

  // Bridge
  getBridgeTransactions(): Promise<BridgeTransaction[]>;
  createBridgeTransaction(tx: Omit<BridgeTransaction, "id">): Promise<BridgeTransaction>;
  updateBridgeTransaction(id: string, updates: Partial<BridgeTransaction>): Promise<BridgeTransaction | undefined>;

  // Dashboard & Metrics
  getDashboardStats(): Promise<DashboardStats>;
  getCompilationMetrics(): Promise<CompilationMetrics>;
  addActivity(activity: Omit<ActivityItem, "id">): Promise<ActivityItem>;
}

export class MemStorage implements IStorage {
  private contracts: Map<string, Contract>;
  private compilations: Map<string, CompilationResult>;
  private deployments: Map<string, Deployment>;
  private securityAnalyses: Map<string, SecurityAnalysis>;
  private stakingPositions: Map<string, StakingPosition>;
  private bridgeTransactions: Map<string, BridgeTransaction>;
  private activities: ActivityItem[];
  private compilationCount: number;
  private successfulCompilations: number;
  private totalCompilationTime: number;

  constructor() {
    this.contracts = new Map();
    this.compilations = new Map();
    this.deployments = new Map();
    this.securityAnalyses = new Map();
    this.stakingPositions = new Map();
    this.bridgeTransactions = new Map();
    this.activities = [];
    this.compilationCount = 0;
    this.successfulCompilations = 0;
    this.totalCompilationTime = 0;

    this.seedData();
  }

  private seedData() {
    const now = new Date();

    const stakingPosition1: StakingPosition = {
      id: randomUUID(),
      amount: 5000,
      currency: "CSPR",
      apy: 8.5,
      startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      rewards: 17.26,
      validator: "casper-validator-1",
    };
    this.stakingPositions.set(stakingPosition1.id, stakingPosition1);

    const stakingPosition2: StakingPosition = {
      id: randomUUID(),
      amount: 2500,
      currency: "CSPR",
      apy: 7.2,
      startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "completed",
      rewards: 24.66,
      validator: "casper-validator-2",
    };
    this.stakingPositions.set(stakingPosition2.id, stakingPosition2);

    const bridgeTx1: BridgeTransaction = {
      id: randomUUID(),
      sourceChain: "casper",
      destinationChain: "sepolia",
      sourceAddress: "casper1abc...",
      destinationAddress: "0x123...",
      amount: 100,
      token: "CSPR",
      status: "completed",
      txHashSource: "0xabc123...",
      txHashDestination: "0xdef456...",
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
      completedAt: new Date(now.getTime() - 3000000).toISOString(),
    };
    this.bridgeTransactions.set(bridgeTx1.id, bridgeTx1);

    this.activities = [
      {
        id: randomUUID(),
        type: "compile",
        description: "Compiled ERC20Token.sol",
        status: "success",
        timestamp: new Date(now.getTime() - 300000).toISOString(),
      },
      {
        id: randomUUID(),
        type: "deploy",
        description: "Deployed NFTMarketplace to testnet",
        status: "success",
        timestamp: new Date(now.getTime() - 900000).toISOString(),
      },
      {
        id: randomUUID(),
        type: "analyze",
        description: "Security audit for StakingPool.sol",
        status: "pending",
        timestamp: new Date(now.getTime() - 1800000).toISOString(),
      },
    ];

    this.compilationCount = 142;
    this.successfulCompilations = 136;
    this.totalCompilationTime = 142 * 245;
  }

  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async createContract(contract: Omit<Contract, "id">): Promise<Contract> {
    const id = randomUUID();
    const newContract: Contract = { ...contract, id };
    this.contracts.set(id, newContract);
    return newContract;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    const updated = { ...contract, ...updates };
    this.contracts.set(id, updated);
    return updated;
  }

  async saveCompilation(result: Omit<CompilationResult, "id">): Promise<CompilationResult> {
    const id = randomUUID();
    const compilation: CompilationResult = { ...result, id };
    this.compilations.set(id, compilation);
    
    this.compilationCount++;
    if (result.success) {
      this.successfulCompilations++;
    }
    this.totalCompilationTime += result.compilationTime;
    
    return compilation;
  }

  async getCompilations(): Promise<CompilationResult[]> {
    return Array.from(this.compilations.values());
  }

  async getDeployment(id: string): Promise<Deployment | undefined> {
    return this.deployments.get(id);
  }

  async getDeployments(): Promise<Deployment[]> {
    return Array.from(this.deployments.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createDeployment(deployment: Omit<Deployment, "id">): Promise<Deployment> {
    const id = randomUUID();
    const newDeployment: Deployment = { ...deployment, id };
    this.deployments.set(id, newDeployment);
    return newDeployment;
  }

  async updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;
    const updated = { ...deployment, ...updates };
    this.deployments.set(id, updated);
    return updated;
  }

  async getSecurityAnalysis(contractId: string): Promise<SecurityAnalysis | undefined> {
    return Array.from(this.securityAnalyses.values()).find(
      (a) => a.contractId === contractId
    );
  }

  async getRecentSecurityAnalyses(): Promise<SecurityAnalysis[]> {
    return Array.from(this.securityAnalyses.values())
      .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
      .slice(0, 10);
  }

  async saveSecurityAnalysis(analysis: Omit<SecurityAnalysis, "id">): Promise<SecurityAnalysis> {
    const id = randomUUID();
    const newAnalysis: SecurityAnalysis = { ...analysis, id };
    this.securityAnalyses.set(id, newAnalysis);
    return newAnalysis;
  }

  async getStakingPositions(): Promise<StakingPosition[]> {
    return Array.from(this.stakingPositions.values());
  }

  async createStakingPosition(position: Omit<StakingPosition, "id">): Promise<StakingPosition> {
    const id = randomUUID();
    const newPosition: StakingPosition = { ...position, id };
    this.stakingPositions.set(id, newPosition);
    return newPosition;
  }

  async updateStakingPosition(id: string, updates: Partial<StakingPosition>): Promise<StakingPosition | undefined> {
    const position = this.stakingPositions.get(id);
    if (!position) return undefined;
    const updated = { ...position, ...updates };
    this.stakingPositions.set(id, updated);
    return updated;
  }

  async getBridgeTransactions(): Promise<BridgeTransaction[]> {
    return Array.from(this.bridgeTransactions.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async createBridgeTransaction(tx: Omit<BridgeTransaction, "id">): Promise<BridgeTransaction> {
    const id = randomUUID();
    const newTx: BridgeTransaction = { ...tx, id };
    this.bridgeTransactions.set(id, newTx);
    return newTx;
  }

  async updateBridgeTransaction(id: string, updates: Partial<BridgeTransaction>): Promise<BridgeTransaction | undefined> {
    const tx = this.bridgeTransactions.get(id);
    if (!tx) return undefined;
    const updated = { ...tx, ...updates };
    this.bridgeTransactions.set(id, updated);
    return updated;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const deployments = await this.getDeployments();
    const successfulDeployments = deployments.filter((d) => d.status === "confirmed");
    const totalGasUsed = successfulDeployments.reduce((sum, d) => sum + d.gasUsed, 0);

    return {
      contractsDeployed: successfulDeployments.length || 12,
      totalGasUsed: totalGasUsed || 2450000,
      successRate: this.compilationCount > 0 
        ? (this.successfulCompilations / this.compilationCount) * 100 
        : 98.5,
      networkStatus: "online",
      recentActivity: this.activities.slice(0, 5),
    };
  }

  async getCompilationMetrics(): Promise<CompilationMetrics> {
    return {
      totalCompilations: this.compilationCount,
      successfulCompilations: this.successfulCompilations,
      failedCompilations: this.compilationCount - this.successfulCompilations,
      averageCompilationTime: this.compilationCount > 0 
        ? Math.round(this.totalCompilationTime / this.compilationCount)
        : 245,
      successRate: this.compilationCount > 0
        ? (this.successfulCompilations / this.compilationCount) * 100
        : 95.77,
    };
  }

  async addActivity(activity: Omit<ActivityItem, "id">): Promise<ActivityItem> {
    const newActivity: ActivityItem = {
      ...activity,
      id: randomUUID(),
    };
    this.activities.unshift(newActivity);
    if (this.activities.length > 50) {
      this.activities = this.activities.slice(0, 50);
    }
    return newActivity;
  }
}

export const storage = new MemStorage();
