import { pgTable, text, integer, boolean, timestamp, jsonb, real, serial, varchar, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sourceCode: text("source_code").notNull(),
  bytecode: text("bytecode"),
  wasmCode: text("wasm_code"),
  abi: jsonb("abi").$type<any[]>(),
  deploymentHash: varchar("deployment_hash", { length: 255 }),
  contractAddress: varchar("contract_address", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  network: varchar("network", { length: 100 }).notNull().default("casper-testnet"),
  gasUsed: integer("gas_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deployedAt: timestamp("deployed_at"),
});

export const compilations = pgTable("compilations", {
  id: serial("id").primaryKey(),
  contractName: varchar("contract_name", { length: 255 }).notNull(),
  bytecode: text("bytecode"),
  wasmCode: text("wasm_code"),
  abi: jsonb("abi").$type<any[]>(),
  sourceMap: text("source_map"),
  gasEstimates: jsonb("gas_estimates").$type<Record<string, any>>(),
  errors: jsonb("errors").$type<string[]>().default([]),
  warnings: jsonb("warnings").$type<string[]>().default([]),
  success: boolean("success").notNull().default(false),
  compilationTime: integer("compilation_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id),
  contractName: varchar("contract_name", { length: 255 }).notNull(),
  deployHash: varchar("deploy_hash", { length: 255 }).notNull(),
  contractAddress: varchar("contract_address", { length: 255 }),
  userPublicKey: varchar("user_public_key", { length: 255 }),
  wasmCodeHash: varchar("wasm_code_hash", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  network: varchar("network", { length: 100 }).notNull().default("casper-testnet"),
  gasUsed: integer("gas_used").default(0),
  cost: real("cost").default(0),
  blockHeight: integer("block_height"),
  blockHash: varchar("block_hash", { length: 255 }),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const securityAnalyses = pgTable("security_analyses", {
  id: serial("id").primaryKey(),
  contractId: varchar("contract_id", { length: 255 }),
  vulnerabilities: jsonb("vulnerabilities").$type<any[]>().default([]),
  optimizations: jsonb("optimizations").$type<string[]>().default([]),
  bestPractices: jsonb("best_practices").$type<string[]>().default([]),
  riskScore: integer("risk_score").default(0),
  recommendation: text("recommendation"),
  coreAnalysis: text("core_analysis"),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

export const stakingPositions = pgTable("staking_positions", {
  id: serial("id").primaryKey(),
  userPublicKey: varchar("user_public_key", { length: 255 }),
  validatorPublicKey: varchar("validator_public_key", { length: 255 }),
  amount: real("amount").notNull(),
  amountMotes: varchar("amount_motes", { length: 100 }),
  currency: varchar("currency", { length: 20 }).notNull().default("CSPR"),
  apy: real("apy").default(8.5),
  lockDuration: integer("lock_duration"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  rewards: real("rewards").default(0),
  validator: varchar("validator", { length: 255 }),
  txHash: varchar("tx_hash", { length: 255 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const bridgeTransactions = pgTable("bridge_transactions", {
  id: serial("id").primaryKey(),
  userPublicKey: varchar("user_public_key", { length: 255 }),
  sourceChain: varchar("source_chain", { length: 100 }).notNull(),
  destinationChain: varchar("destination_chain", { length: 100 }).notNull(),
  sourceAddress: varchar("source_address", { length: 255 }),
  destinationAddress: varchar("destination_address", { length: 255 }),
  amount: real("amount").notNull(),
  token: varchar("token", { length: 50 }).notNull(),
  fee: real("fee").default(0),
  status: varchar("status", { length: 50 }).notNull().default("initiated"),
  txHashSource: varchar("tx_hash_source", { length: 255 }),
  txHashDestination: varchar("tx_hash_destination", { length: 255 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletConnections = pgTable("wallet_connections", {
  id: serial("id").primaryKey(),
  publicKey: varchar("public_key", { length: 255 }).notNull().unique(),
  accountHash: varchar("account_hash", { length: 255 }),
  address: varchar("address", { length: 255 }).notNull(),
  networkId: varchar("network_id", { length: 100 }).notNull().default("casper-testnet"),
  balance: varchar("balance", { length: 100 }),
  balanceCSPR: real("balance_cspr"),
  nonce: varchar("nonce", { length: 255 }),
  lastConnected: timestamp("last_connected").defaultNow().notNull(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true });
export const insertCompilationSchema = createInsertSchema(compilations).omit({ id: true, createdAt: true });
export const insertDeploymentSchema = createInsertSchema(deployments).omit({ id: true, createdAt: true });
export const insertSecurityAnalysisSchema = createInsertSchema(securityAnalyses).omit({ id: true, analyzedAt: true });
export const insertStakingPositionSchema = createInsertSchema(stakingPositions).omit({ id: true });
export const insertBridgeTransactionSchema = createInsertSchema(bridgeTransactions).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertWalletConnectionSchema = createInsertSchema(walletConnections).omit({ id: true });

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Compilation = typeof compilations.$inferSelect;
export type InsertCompilation = z.infer<typeof insertCompilationSchema>;
export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type SecurityAnalysis = typeof securityAnalyses.$inferSelect;
export type InsertSecurityAnalysis = z.infer<typeof insertSecurityAnalysisSchema>;
export type StakingPosition = typeof stakingPositions.$inferSelect;
export type InsertStakingPosition = z.infer<typeof insertStakingPositionSchema>;
export type BridgeTransaction = typeof bridgeTransactions.$inferSelect;
export type InsertBridgeTransaction = z.infer<typeof insertBridgeTransactionSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type WalletConnection = typeof walletConnections.$inferSelect;
export type InsertWalletConnection = z.infer<typeof insertWalletConnectionSchema>;
