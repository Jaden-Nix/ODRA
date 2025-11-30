import { z } from "zod";

export interface CompilationResult {
  id: string;
  contractName: string;
  bytecode: string;
  wasmCode: string;
  abi: ABIEntry[];
  sourceMap: string;
  gasEstimates: Record<string, number>;
  errors: string[];
  warnings: string[];
  success: boolean;
  compilationTime: number;
  timestamp: string;
}

export interface ABIEntry {
  type: string;
  name: string;
  inputs?: { name: string; type: string }[];
  outputs?: { name: string; type: string }[];
  stateMutability?: string;
}

export interface Contract {
  id: string;
  name: string;
  sourceCode: string;
  bytecode: string;
  wasmCode: string;
  abi: ABIEntry[];
  deploymentHash?: string;
  contractAddress?: string;
  status: "draft" | "compiled" | "deployed" | "verified";
  network: string;
  gasUsed?: number;
  createdAt: string;
  deployedAt?: string;
}

export interface Deployment {
  id: string;
  contractId: string;
  contractName: string;
  deployHash: string;
  contractAddress?: string;
  userPublicKey?: string;
  status: "pending" | "confirmed" | "failed";
  network: string;
  gasUsed: number;
  cost: number;
  timestamp: string;
  blockHeight?: number;
  blockHash?: string;
  error?: string;
  explorerLink?: string;
}

export interface Vulnerability {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location: string;
  fix: string;
  cveReference?: string;
}

export interface SecurityAnalysis {
  id: string;
  contractId: string;
  vulnerabilities: Vulnerability[];
  optimizations: string[];
  bestPractices: string[];
  riskScore: number;
  recommendation: string;
  coreAnalysis: string;
  analyzedAt: string;
}

export interface StakingPosition {
  id: string;
  userPublicKey?: string;
  validatorPublicKey?: string;
  amount: number;
  amountCSPR?: number;
  currency: string;
  apy: number;
  lockDuration?: number;
  startDate: string;
  endDate?: string;
  status: "active" | "pending" | "unstaking" | "completed";
  rewards: number;
  estimatedDailyReward?: number;
  estimatedAnnualReward?: number;
  validator?: string;
}

export interface ValidatorInfo {
  publicKey: string;
  delegatorsCount: number;
  totalStake: string;
  totalStakeCSPR: number;
  commission: number;
  commissionPercentage: number;
  isActive: boolean;
  apy: number;
  rank?: number;
}

export interface YieldAdvice {
  projectedYield: number;
  strategies: string[];
  risks: string[];
  recommendation: string;
  compoundingSchedule: string;
}

export interface BridgeTransaction {
  id: string;
  userPublicKey?: string;
  sourceChain: string;
  destinationChain: string;
  sourceAddress: string;
  destinationAddress: string;
  amount: number;
  token: string;
  fee?: number;
  status: "initiated" | "locked" | "released" | "minting" | "completed" | "failed";
  txHashSource?: string;
  txHashDestination?: string;
  errorMessage?: string;
  timestamp: string;
  completedAt?: string;
}

export interface BridgeFeeEstimate {
  fee: number;
  feePercentage: number;
  totalCost: number;
  estimatedTime: string;
}

export interface WalletConnection {
  publicKey: string;
  accountHash: string;
  address: string;
  balance: number;
  balanceInMotes: string;
  connected: boolean;
  networkId: string;
  connectedAt?: string;
}

export interface ConnectedWallet {
  publicKey: string;
  accountHash: string;
  address: string;
  balanceInCSPR: number;
  balanceInMotes: string;
  isConnected: boolean;
  connectedAt: string;
  networkId: string;
}

export interface NetworkStatus {
  blockHeight: number;
  era: number;
  chainName: string;
  peers: number;
  isOnline: boolean;
  lastBlockTime?: string;
  stateRootHash?: string;
  explorerUrl?: string;
  networkName?: string;
}

export interface CompilationMetrics {
  totalCompilations: number;
  successfulCompilations: number;
  failedCompilations: number;
  averageCompilationTime: number;
  successRate: number;
}

export interface DashboardStats {
  contractsDeployed: number;
  totalGasUsed: number;
  successRate: number;
  networkStatus: "online" | "degraded" | "offline";
  recentActivity: ActivityItem[];
  blockHeight?: number;
  era?: number;
  chainName?: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  status: "success" | "pending" | "failed";
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface StakingSummary {
  totalStaked: number;
  totalRewards: number;
  averageAPY: number;
  activePositions: number;
  pendingPositions: number;
}

export interface BridgeStats {
  totalTransfers: number;
  totalVolumeCSPR: number;
  completedTransfers: number;
  failedTransfers: number;
  pendingTransfers: number;
  avgCompletionTime: number;
}

export const compileRequestSchema = z.object({
  code: z.string().min(50, "Contract code too short"),
  contractName: z.string().min(1).default("Contract"),
});

export const analyzeRequestSchema = z.object({
  contractCode: z.string().min(50, "Contract code too short"),
});

export const deployRequestSchema = z.object({
  contractId: z.string().optional(),
  contractName: z.string().min(1),
  wasmCode: z.string().optional(),
  publicKeyHex: z.string().optional(),
  network: z.string().default("casper-testnet"),
});

export const stakeRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  duration: z.number().positive("Duration must be positive"),
  validator: z.string().optional(),
  publicKeyHex: z.string().optional(),
  validatorPublicKey: z.string().optional(),
});

export const bridgeRequestSchema = z.object({
  sourceChain: z.string(),
  destinationChain: z.string(),
  amount: z.number().positive(),
  token: z.string(),
  publicKeyHex: z.string().optional(),
  sourceAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
});

export const walletConnectSchema = z.object({
  publicKeyHex: z.string().min(64).max(70),
});

export type CompileRequest = z.infer<typeof compileRequestSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type DeployRequest = z.infer<typeof deployRequestSchema>;
export type StakeRequest = z.infer<typeof stakeRequestSchema>;
export type BridgeRequest = z.infer<typeof bridgeRequestSchema>;
export type WalletConnectRequest = z.infer<typeof walletConnectSchema>;
