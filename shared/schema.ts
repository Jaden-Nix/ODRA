import { z } from "zod";

// Contract compilation and deployment types
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
  status: "pending" | "confirmed" | "failed";
  network: string;
  gasUsed: number;
  cost: number;
  timestamp: string;
  blockHeight?: number;
  error?: string;
}

// AI Security Analysis types
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

// Staking types
export interface StakingPosition {
  id: string;
  amount: number;
  currency: string;
  apy: number;
  startDate: string;
  endDate?: string;
  status: "active" | "unstaking" | "completed";
  rewards: number;
  validator?: string;
}

export interface YieldAdvice {
  projectedYield: number;
  strategies: string[];
  risks: string[];
  recommendation: string;
  compoundingSchedule: string;
}

// Bridge types
export interface BridgeTransaction {
  id: string;
  sourceChain: string;
  destinationChain: string;
  sourceAddress: string;
  destinationAddress: string;
  amount: number;
  token: string;
  status: "initiated" | "locked" | "minting" | "completed" | "failed";
  txHashSource?: string;
  txHashDestination?: string;
  timestamp: string;
  completedAt?: string;
}

// Wallet types
export interface WalletConnection {
  publicKey: string;
  address: string;
  balance: number;
  connected: boolean;
  networkId: string;
}

// Network status
export interface NetworkStatus {
  blockHeight: number;
  era: number;
  chainName: string;
  peers: number;
  isOnline: boolean;
}

// Compilation metrics
export interface CompilationMetrics {
  totalCompilations: number;
  successfulCompilations: number;
  failedCompilations: number;
  averageCompilationTime: number;
  successRate: number;
}

// Dashboard stats
export interface DashboardStats {
  contractsDeployed: number;
  totalGasUsed: number;
  successRate: number;
  networkStatus: "online" | "degraded" | "offline";
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: "compile" | "deploy" | "analyze" | "stake" | "bridge";
  description: string;
  status: "success" | "pending" | "failed";
  timestamp: string;
}

// Zod schemas for validation
export const compileRequestSchema = z.object({
  code: z.string().min(50, "Contract code too short"),
  contractName: z.string().min(1).default("Contract"),
});

export const analyzeRequestSchema = z.object({
  contractCode: z.string().min(50, "Contract code too short"),
});

export const deployRequestSchema = z.object({
  contractId: z.string(),
  network: z.string().default("casper-testnet"),
});

export const stakeRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  duration: z.number().positive("Duration must be positive"),
  validator: z.string().optional(),
});

export const bridgeRequestSchema = z.object({
  sourceChain: z.string(),
  destinationChain: z.string(),
  amount: z.number().positive(),
  token: z.string(),
});

export const walletConnectSchema = z.object({
  publicKey: z.string().regex(/^[0-9a-f]{66}$/i, "Invalid public key format"),
});

export type CompileRequest = z.infer<typeof compileRequestSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type DeployRequest = z.infer<typeof deployRequestSchema>;
export type StakeRequest = z.infer<typeof stakeRequestSchema>;
export type BridgeRequest = z.infer<typeof bridgeRequestSchema>;
export type WalletConnectRequest = z.infer<typeof walletConnectSchema>;
