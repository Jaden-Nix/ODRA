import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import {
  compileRequestSchema,
  analyzeRequestSchema,
  stakeRequestSchema,
  bridgeRequestSchema,
} from "@shared/schema";
import type { CompilationResult, SecurityAnalysis, Vulnerability } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Compile Solidity contract
  app.post("/api/compile", async (req, res) => {
    try {
      const { code, contractName } = compileRequestSchema.parse(req.body);
      
      const startTime = Date.now();
      
      if (!code.includes("pragma solidity")) {
        const result: CompilationResult = {
          id: "",
          contractName,
          bytecode: "",
          wasmCode: "",
          abi: [],
          sourceMap: "",
          gasEstimates: {},
          errors: ["Missing pragma directive"],
          warnings: [],
          success: false,
          compilationTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
        
        const saved = await storage.saveCompilation(result);
        await storage.addActivity({
          type: "compile",
          description: `Failed to compile ${contractName}`,
          status: "failed",
          timestamp: new Date().toISOString(),
        });
        
        return res.status(400).json(saved);
      }

      if (!code.includes("contract")) {
        const result: CompilationResult = {
          id: "",
          contractName,
          bytecode: "",
          wasmCode: "",
          abi: [],
          sourceMap: "",
          gasEstimates: {},
          errors: ["Missing contract definition"],
          warnings: [],
          success: false,
          compilationTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
        
        const saved = await storage.saveCompilation(result);
        return res.status(400).json(saved);
      }

      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      const mockAbi = [
        {
          type: "constructor",
          name: "",
          inputs: [{ name: "_initialSupply", type: "uint256" }],
        },
        {
          type: "function",
          name: "transfer",
          inputs: [
            { name: "_to", type: "address" },
            { name: "_value", type: "uint256" },
          ],
          outputs: [{ name: "success", type: "bool" }],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "balanceOf",
          inputs: [{ name: "_owner", type: "address" }],
          outputs: [{ name: "balance", type: "uint256" }],
          stateMutability: "view",
        },
        {
          type: "event",
          name: "Transfer",
          inputs: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
          ],
        },
      ];

      const mockBytecode = "0x608060405234801561001057600080fd5b50" + 
        Buffer.from(code.substring(0, 100)).toString("hex");
      
      const wasmHeader = "0061736d01000000";
      const wasmCode = wasmHeader + Buffer.from(JSON.stringify({
        contract: contractName,
        compiled: new Date().toISOString(),
      })).toString("hex") + mockBytecode.substring(0, 64);

      const warnings: string[] = [];
      if (code.includes("selfdestruct")) {
        warnings.push("Warning: selfdestruct is deprecated");
      }
      if (!code.includes("// SPDX-License-Identifier")) {
        warnings.push("Warning: SPDX license identifier not provided");
      }

      const result: CompilationResult = {
        id: "",
        contractName,
        bytecode: mockBytecode,
        wasmCode,
        abi: mockAbi,
        sourceMap: "0:0:0:-:0",
        gasEstimates: {
          creation: 250000 + Math.floor(code.length * 10),
          external: {
            transfer: 45000,
            balanceOf: 2500,
          },
        },
        errors: [],
        warnings,
        success: true,
        compilationTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      const saved = await storage.saveCompilation(result);
      
      await storage.addActivity({
        type: "compile",
        description: `Compiled ${contractName}.sol`,
        status: "success",
        timestamp: new Date().toISOString(),
      });

      res.json(saved);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: "Compilation failed", 
        details: (error as Error).message 
      });
    }
  });

  // AI Security Analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { contractCode } = analyzeRequestSchema.parse(req.body);
      
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      const vulnerabilities: Vulnerability[] = [];
      let riskScore = 0;

      if (contractCode.includes("call{value:") && 
          contractCode.indexOf("call{value:") < contractCode.indexOf("-=")) {
        vulnerabilities.push({
          id: "v1",
          type: "Reentrancy",
          severity: "critical",
          description: "External call is made before state update. This allows an attacker to re-enter the function before the state is updated.",
          location: "withdraw() function",
          fix: "Use the checks-effects-interactions pattern. Update state before making external calls.",
          cveReference: "CWE-841",
        });
        riskScore += 40;
      }

      if (!contractCode.includes("onlyOwner") && 
          !contractCode.includes("require(msg.sender ==") &&
          contractCode.includes("function") &&
          (contractCode.includes("transfer(") || contractCode.includes("selfdestruct"))) {
        vulnerabilities.push({
          id: "v2",
          type: "Missing Access Control",
          severity: "high",
          description: "Critical functions lack proper access control modifiers.",
          location: "Multiple functions",
          fix: "Add onlyOwner modifier or require statements to restrict access.",
        });
        riskScore += 25;
      }

      if (contractCode.includes("tx.origin")) {
        vulnerabilities.push({
          id: "v3",
          type: "tx.origin Usage",
          severity: "medium",
          description: "Using tx.origin for authorization can be exploited through phishing attacks.",
          location: "Authorization check",
          fix: "Replace tx.origin with msg.sender for authorization checks.",
        });
        riskScore += 15;
      }

      if (contractCode.includes("block.timestamp") || contractCode.includes("now")) {
        vulnerabilities.push({
          id: "v4",
          type: "Timestamp Dependence",
          severity: "low",
          description: "Block timestamp can be manipulated by miners within a ~15 second window.",
          location: "Time-dependent logic",
          fix: "Avoid relying on block.timestamp for critical logic. Use block numbers instead.",
        });
        riskScore += 5;
      }

      const optimizations: string[] = [];
      if (contractCode.includes("public") && contractCode.includes("view")) {
        optimizations.push("Consider using external instead of public for functions only called externally");
      }
      if (contractCode.includes("memory") && contractCode.includes("function")) {
        optimizations.push("Use calldata instead of memory for read-only function parameters");
      }
      if (contractCode.includes("uint256") && contractCode.includes("++")) {
        optimizations.push("Use unchecked blocks for incrementing loop counters to save gas");
      }
      if (contractCode.includes("storage")) {
        optimizations.push("Cache storage variables in memory when reading multiple times");
      }

      const bestPractices: string[] = [];
      if (!contractCode.includes("event")) {
        bestPractices.push("Add events for important state changes to enable off-chain tracking");
      }
      if (!contractCode.includes("@notice") && !contractCode.includes("@dev")) {
        bestPractices.push("Add NatSpec documentation for better code readability");
      }
      if (!contractCode.includes("require(") && !contractCode.includes("revert")) {
        bestPractices.push("Add input validation with require statements");
      }
      bestPractices.push("Consider implementing a pause mechanism for emergency situations");
      bestPractices.push("Use SafeMath or Solidity 0.8+ for arithmetic operations");

      riskScore = Math.min(100, riskScore);

      let recommendation = "";
      if (riskScore >= 60) {
        recommendation = "CRITICAL: Do not deploy this contract. Address critical vulnerabilities first.";
      } else if (riskScore >= 40) {
        recommendation = "HIGH RISK: Significant security issues found. Review and fix before deployment.";
      } else if (riskScore >= 20) {
        recommendation = "MEDIUM RISK: Some issues detected. Consider addressing them for improved security.";
      } else {
        recommendation = "LOW RISK: Contract appears relatively safe. Apply optimizations if desired.";
      }

      const analysis: Omit<SecurityAnalysis, "id"> = {
        contractId: "temp-" + Date.now(),
        vulnerabilities,
        optimizations,
        bestPractices,
        riskScore,
        recommendation,
        coreAnalysis: `Analyzed ${contractCode.length} characters of Solidity code. Found ${vulnerabilities.length} potential vulnerabilities.`,
        analyzedAt: new Date().toISOString(),
      };

      const saved = await storage.saveSecurityAnalysis(analysis);

      await storage.addActivity({
        type: "analyze",
        description: `Security analysis completed (Score: ${riskScore}/100)`,
        status: riskScore >= 60 ? "failed" : "success",
        timestamp: new Date().toISOString(),
      });

      res.json({ success: true, analysis: saved });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      res.status(500).json({ 
        error: "Analysis failed", 
        details: (error as Error).message 
      });
    }
  });

  // Get recent security analyses
  app.get("/api/security/recent", async (req, res) => {
    try {
      const analyses = await storage.getRecentSecurityAnalyses();
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch security analyses" });
    }
  });

  // Deploy contract
  app.post("/api/deploy", async (req, res) => {
    try {
      const { contractId, network } = z.object({
        contractId: z.string(),
        network: z.string().default("casper-testnet"),
      }).parse(req.body);

      await new Promise(resolve => setTimeout(resolve, 300));

      const deployHash = "0x" + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      const deployment = await storage.createDeployment({
        contractId,
        contractName: "Contract",
        deployHash,
        status: "pending",
        network,
        gasUsed: 0,
        cost: 2.5,
        timestamp: new Date().toISOString(),
      });

      await storage.addActivity({
        type: "deploy",
        description: `Deployment initiated on ${network}`,
        status: "pending",
        timestamp: new Date().toISOString(),
      });

      setTimeout(async () => {
        const contractAddress = "casper1" + Array.from({ length: 58 }, () => 
          Math.floor(Math.random() * 36).toString(36)
        ).join("");

        await storage.updateDeployment(deployment.id, {
          status: "confirmed",
          contractAddress,
          gasUsed: 2500000 + Math.floor(Math.random() * 500000),
          blockHeight: 1234567 + Math.floor(Math.random() * 1000),
        });
      }, 3000);

      res.json(deployment);
    } catch (error) {
      res.status(500).json({ 
        error: "Deployment failed", 
        details: (error as Error).message 
      });
    }
  });

  // Get deployments
  app.get("/api/deployments", async (req, res) => {
    try {
      const deployments = await storage.getDeployments();
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployments" });
    }
  });

  // Yield calculation
  app.post("/api/yield", async (req, res) => {
    try {
      const { amount, duration } = z.object({
        amount: z.number().positive(),
        duration: z.number().positive(),
      }).parse(req.body);

      const apy = 8.5;
      const projectedYield = amount * (apy / 100) * (duration / 365);

      const strategies = [
        `Optimal lock duration is ${Math.min(duration + 30, 365)} days for better APY`,
        "Consider splitting stake across multiple validators for risk diversification",
        "Compound rewards monthly for maximum yield optimization",
        "Monitor validator performance regularly to ensure optimal returns",
      ];

      const risks = [
        "Validator slashing risk if validator misbehaves",
        "Lock-up period means funds are illiquid",
        "APY may fluctuate based on network conditions",
      ];

      res.json({
        projectedYield,
        strategies,
        risks,
        recommendation: `Staking ${amount} CSPR for ${duration} days at ${apy}% APY will yield approximately ${projectedYield.toFixed(2)} CSPR`,
        compoundingSchedule: duration >= 90 ? "Monthly" : "At maturity",
      });
    } catch (error) {
      res.status(400).json({ error: "Yield calculation failed" });
    }
  });

  // Staking positions
  app.get("/api/staking/positions", async (req, res) => {
    try {
      const positions = await storage.getStakingPositions();
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staking positions" });
    }
  });

  // Create staking position
  app.post("/api/stake", async (req, res) => {
    try {
      const data = stakeRequestSchema.parse(req.body);
      
      const position = await storage.createStakingPosition({
        amount: data.amount,
        currency: "CSPR",
        apy: 8.5,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        rewards: 0,
        validator: data.validator,
      });

      await storage.addActivity({
        type: "stake",
        description: `Staked ${data.amount} CSPR for ${data.duration} days`,
        status: "success",
        timestamp: new Date().toISOString(),
      });

      res.json(position);
    } catch (error) {
      res.status(400).json({ error: "Staking failed" });
    }
  });

  // Bridge transactions
  app.get("/api/bridge/transactions", async (req, res) => {
    try {
      const transactions = await storage.getBridgeTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bridge transactions" });
    }
  });

  // Create bridge transaction
  app.post("/api/bridge", async (req, res) => {
    try {
      const data = bridgeRequestSchema.parse(req.body);
      
      const tx = await storage.createBridgeTransaction({
        sourceChain: data.sourceChain,
        destinationChain: data.destinationChain,
        sourceAddress: "casper1user...",
        destinationAddress: "0xuser...",
        amount: data.amount,
        token: data.token,
        status: "initiated",
        timestamp: new Date().toISOString(),
      });

      await storage.addActivity({
        type: "bridge",
        description: `Bridging ${data.amount} ${data.token} to ${data.destinationChain}`,
        status: "pending",
        timestamp: new Date().toISOString(),
      });

      setTimeout(async () => {
        await storage.updateBridgeTransaction(tx.id, { status: "locked" });
        setTimeout(async () => {
          await storage.updateBridgeTransaction(tx.id, { status: "minting" });
          setTimeout(async () => {
            await storage.updateBridgeTransaction(tx.id, { 
              status: "completed",
              completedAt: new Date().toISOString(),
              txHashDestination: "0x" + Array.from({ length: 64 }, () => 
                Math.floor(Math.random() * 16).toString(16)
              ).join(""),
            });
          }, 2000);
        }, 2000);
      }, 2000);

      res.json(tx);
    } catch (error) {
      res.status(400).json({ error: "Bridge transaction failed" });
    }
  });

  // Compilation metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getCompilationMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Get contracts
  app.get("/api/contracts", async (req, res) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  return httpServer;
}
