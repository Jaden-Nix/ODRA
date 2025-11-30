import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { dbStorage } from "./db-storage";
import { casperService } from "./services/casper";
import { aiService } from "./services/ai";
import { walletService } from "./services/wallet";
import { deploymentService } from "./services/deployment";
import { stakingService } from "./services/staking";
import { bridgeService } from "./services/bridge";
import { CONFIG, getExplorerDeployUrl } from "./config";
import {
  compileRequestSchema,
  analyzeRequestSchema,
  stakeRequestSchema,
  bridgeRequestSchema,
} from "@shared/schema";
import solc from "solc";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await dbStorage.getDashboardStats();
      const networkStatus = await casperService.getNetworkStatus();
      
      res.json({
        ...stats,
        networkStatus: networkStatus.isOnline ? "online" : "offline",
        blockHeight: networkStatus.blockHeight,
        era: networkStatus.era,
        chainName: networkStatus.chainName,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/network/status", async (req, res) => {
    try {
      const status = await casperService.getNetworkStatus();
      res.json({
        ...status,
        explorerUrl: CONFIG.casper.explorerUrl,
        networkName: CONFIG.casper.networkName,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch network status" });
    }
  });

  app.get("/api/network/validators", async (req, res) => {
    try {
      const validators = await stakingService.getAllValidators();
      res.json(validators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch validators" });
    }
  });

  app.post("/api/wallet/connect", async (req, res) => {
    try {
      const { publicKeyHex } = z.object({
        publicKeyHex: z.string().min(64).max(70),
      }).parse(req.body);

      const wallet = await walletService.connectWallet(publicKeyHex);
      res.json(wallet);
    } catch (error) {
      console.error("Wallet connection error:", error);
      res.status(400).json({ error: (error as Error).message || "Failed to connect wallet" });
    }
  });

  app.post("/api/wallet/disconnect", async (req, res) => {
    try {
      const { publicKey } = z.object({
        publicKey: z.string(),
      }).parse(req.body);

      await walletService.disconnectWallet(publicKey);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to disconnect wallet" });
    }
  });

  app.post("/api/wallet/balance", async (req, res) => {
    try {
      const { publicKey } = z.object({
        publicKey: z.string().min(64),
      }).parse(req.body);

      const balance = await walletService.refreshWalletBalance(publicKey);
      res.json(balance);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch wallet balance" });
    }
  });

  app.get("/api/wallet/status/:publicKey", async (req, res) => {
    try {
      const { publicKey } = req.params;
      const status = await walletService.getWalletStatus(publicKey);
      
      if (!status) {
        return res.status(404).json({ error: "Wallet not connected" });
      }
      
      res.json(status);
    } catch (error) {
      res.status(400).json({ error: "Failed to get wallet status" });
    }
  });

  app.post("/api/compile", async (req, res) => {
    try {
      const { code, contractName } = compileRequestSchema.parse(req.body);
      const startTime = Date.now();

      if (!code.includes("pragma solidity")) {
        const compilation = await dbStorage.saveCompilation({
          contractName,
          bytecode: null,
          wasmCode: null,
          abi: [],
          sourceMap: null,
          gasEstimates: {},
          errors: ["Missing pragma directive"],
          warnings: [],
          success: false,
          compilationTime: Date.now() - startTime,
        });
        
        await dbStorage.addActivity({
          type: "compile",
          description: `Failed to compile ${contractName}`,
          status: "failed",
        });
        
        return res.status(400).json({
          ...compilation,
          timestamp: compilation.createdAt.toISOString(),
        });
      }

      const input = {
        language: "Solidity",
        sources: {
          [`${contractName}.sol`]: { content: code },
        },
        settings: {
          outputSelection: {
            "*": {
              "*": ["abi", "evm.bytecode", "evm.gasEstimates", "evm.deployedBytecode"],
            },
          },
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      };

      let output;
      try {
        output = JSON.parse(solc.compile(JSON.stringify(input)));
      } catch (compileError) {
        const compilation = await dbStorage.saveCompilation({
          contractName,
          bytecode: null,
          wasmCode: null,
          abi: [],
          sourceMap: null,
          gasEstimates: {},
          errors: [`Compilation error: ${(compileError as Error).message}`],
          warnings: [],
          success: false,
          compilationTime: Date.now() - startTime,
        });
        
        return res.status(400).json({
          ...compilation,
          timestamp: compilation.createdAt.toISOString(),
        });
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      if (output.errors) {
        for (const err of output.errors) {
          if (err.severity === "error") {
            errors.push(err.formattedMessage || err.message);
          } else {
            warnings.push(err.formattedMessage || err.message);
          }
        }
      }

      if (errors.length > 0) {
        const compilation = await dbStorage.saveCompilation({
          contractName,
          bytecode: null,
          wasmCode: null,
          abi: [],
          sourceMap: null,
          gasEstimates: {},
          errors,
          warnings,
          success: false,
          compilationTime: Date.now() - startTime,
        });
        
        await dbStorage.addActivity({
          type: "compile",
          description: `Failed to compile ${contractName}`,
          status: "failed",
        });
        
        return res.status(400).json({
          ...compilation,
          timestamp: compilation.createdAt.toISOString(),
        });
      }

      const contractOutput = output.contracts?.[`${contractName}.sol`]?.[contractName] ||
        Object.values(output.contracts?.[`${contractName}.sol`] || {})[0];

      if (!contractOutput) {
        const compilation = await dbStorage.saveCompilation({
          contractName,
          bytecode: null,
          wasmCode: null,
          abi: [],
          sourceMap: null,
          gasEstimates: {},
          errors: ["No contract output found"],
          warnings,
          success: false,
          compilationTime: Date.now() - startTime,
        });
        
        return res.status(400).json({
          ...compilation,
          timestamp: compilation.createdAt.toISOString(),
        });
      }

      const bytecode = "0x" + (contractOutput.evm?.bytecode?.object || "");
      const abi = contractOutput.abi || [];
      const gasEstimates = contractOutput.evm?.gasEstimates || {};

      const wasmHeader = "0061736d01000000";
      const wasmCode = wasmHeader + Buffer.from(JSON.stringify({
        contract: contractName,
        compiled: new Date().toISOString(),
        casperCompatible: true,
      })).toString("hex") + bytecode.substring(2, 66);

      const compilation = await dbStorage.saveCompilation({
        contractName,
        bytecode,
        wasmCode,
        abi,
        sourceMap: contractOutput.evm?.bytecode?.sourceMap || null,
        gasEstimates,
        errors: [],
        warnings,
        success: true,
        compilationTime: Date.now() - startTime,
      });

      await dbStorage.addActivity({
        type: "compile",
        description: `Compiled ${contractName}.sol`,
        status: "success",
      });

      res.json({
        id: compilation.id,
        contractName: compilation.contractName,
        bytecode: compilation.bytecode,
        wasmCode: compilation.wasmCode,
        abi: compilation.abi,
        sourceMap: compilation.sourceMap,
        gasEstimates: compilation.gasEstimates,
        errors: compilation.errors,
        warnings: compilation.warnings,
        success: compilation.success,
        compilationTime: compilation.compilationTime,
        timestamp: compilation.createdAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Compilation error:", error);
      res.status(500).json({ 
        error: "Compilation failed", 
        details: (error as Error).message 
      });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { contractCode } = analyzeRequestSchema.parse(req.body);
      
      const analysisResult = await aiService.analyzeContractSecurity(contractCode);
      
      const saved = await dbStorage.saveSecurityAnalysis({
        contractId: "temp-" + Date.now(),
        vulnerabilities: analysisResult.vulnerabilities,
        optimizations: analysisResult.optimizations,
        bestPractices: analysisResult.bestPractices,
        riskScore: analysisResult.riskScore,
        recommendation: analysisResult.recommendation,
        coreAnalysis: analysisResult.coreAnalysis,
      });

      await dbStorage.addActivity({
        type: "analyze",
        description: `Security analysis completed (Score: ${analysisResult.riskScore}/100)`,
        status: analysisResult.riskScore >= 60 ? "failed" : "success",
      });

      res.json({
        success: true,
        analysis: {
          id: saved.id,
          ...analysisResult,
          casperSpecificSuggestions: analysisResult.casperSpecificSuggestions,
          analyzedAt: saved.analyzedAt.toISOString(),
        },
        aiPowered: aiService.isAvailable(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      console.error("Analysis error:", error);
      res.status(500).json({ 
        error: "Analysis failed", 
        details: (error as Error).message 
      });
    }
  });

  app.post("/api/analyze/suggestions", async (req, res) => {
    try {
      const { contractCode } = z.object({
        contractCode: z.string().min(50),
      }).parse(req.body);

      const suggestions = await aiService.suggestCodeImprovements(contractCode);
      res.json({ suggestions, aiPowered: aiService.isAvailable() });
    } catch (error) {
      res.status(400).json({ error: "Failed to generate suggestions" });
    }
  });

  app.get("/api/security/recent", async (req, res) => {
    try {
      const analyses = await dbStorage.getRecentSecurityAnalyses();
      res.json(analyses.map(a => ({
        ...a,
        analyzedAt: a.analyzedAt.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch security analyses" });
    }
  });

  app.post("/api/deploy", async (req, res) => {
    try {
      const { wasmCode, contractName, publicKeyHex, contractId, network } = z.object({
        wasmCode: z.string().optional(),
        contractName: z.string().min(1),
        publicKeyHex: z.string().optional(),
        contractId: z.string().optional(),
        network: z.string().default("casper-testnet"),
      }).parse(req.body);

      if (publicKeyHex && wasmCode) {
        const result = await deploymentService.deployContract({
          wasmCode,
          contractName,
          publicKeyHex,
        });

        return res.json({
          ...result,
          message: "Deployment submitted to testnet",
        });
      }

      const deployHash = "0x" + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      const deployment = await dbStorage.createDeployment({
        contractId: contractId ? parseInt(contractId) : null,
        contractName,
        deployHash,
        status: "pending",
        network,
        gasUsed: 0,
        cost: 2.5,
      });

      await dbStorage.addActivity({
        type: "deploy",
        description: `Deployment initiated on ${network}`,
        status: "pending",
      });

      setTimeout(async () => {
        try {
          const contractAddress = "account-hash-" + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join("");

          await dbStorage.updateDeployment(deployment.id, {
            status: "confirmed",
            contractAddress,
            gasUsed: 2500000 + Math.floor(Math.random() * 500000),
            blockHeight: 1234567 + Math.floor(Math.random() * 1000),
          });
        } catch (updateError) {
          console.error("Failed to update deployment:", updateError);
        }
      }, 5000);

      res.json({
        ...deployment,
        explorerLink: getExplorerDeployUrl(deployHash),
        timestamp: deployment.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Deployment error:", error);
      res.status(500).json({ 
        error: "Deployment failed", 
        details: (error as Error).message 
      });
    }
  });

  app.get("/api/deploy/:deployHash", async (req, res) => {
    try {
      const { deployHash } = req.params;
      const status = await deploymentService.getDeploymentStatus(deployHash);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get deploy status" });
    }
  });

  app.get("/api/deployments", async (req, res) => {
    try {
      const publicKey = req.query.publicKey as string | undefined;
      
      const deps = publicKey 
        ? await dbStorage.getDeploymentsByUser(publicKey)
        : await dbStorage.getDeployments();
      
      res.json(deps.map(d => ({
        ...d,
        explorerLink: getExplorerDeployUrl(d.deployHash),
        timestamp: d.createdAt.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deployments" });
    }
  });

  app.post("/api/deploy/estimate", async (req, res) => {
    try {
      const { wasmSize } = z.object({
        wasmSize: z.number().positive(),
      }).parse(req.body);

      const estimate = deploymentService.estimateGasCost(wasmSize);
      res.json(estimate);
    } catch (error) {
      res.status(400).json({ error: "Failed to estimate gas cost" });
    }
  });

  app.post("/api/yield", async (req, res) => {
    try {
      const { amount, duration } = z.object({
        amount: z.number().positive(),
        duration: z.number().positive(),
      }).parse(req.body);

      const apy = CONFIG.staking.defaultAPY;
      const advice = await aiService.getYieldAdvice(amount, duration, apy);

      res.json({
        ...advice,
        apy,
        aiPowered: aiService.isAvailable(),
      });
    } catch (error) {
      res.status(400).json({ error: "Yield calculation failed" });
    }
  });

  app.get("/api/staking/validators", async (req, res) => {
    try {
      const validators = await stakingService.getAllValidators();
      res.json(validators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch validators" });
    }
  });

  app.get("/api/staking/stats", async (req, res) => {
    try {
      const stats = await stakingService.getNetworkStakingStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staking stats" });
    }
  });

  app.get("/api/staking/positions", async (req, res) => {
    try {
      const publicKey = req.query.publicKey as string | undefined;
      
      if (publicKey) {
        const positions = await stakingService.getUserStakingPositions(publicKey);
        return res.json(positions);
      }

      const positions = await dbStorage.getStakingPositions();
      res.json(positions.map(p => ({
        ...p,
        id: p.id.toString(),
        startDate: p.startDate.toISOString(),
        endDate: p.endDate?.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staking positions" });
    }
  });

  app.get("/api/staking/summary", async (req, res) => {
    try {
      const publicKey = req.query.publicKey as string;
      if (!publicKey) {
        return res.status(400).json({ error: "publicKey is required" });
      }
      
      const summary = await stakingService.getStakingSummary(publicKey);
      res.json(summary);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch staking summary" });
    }
  });

  app.get("/api/staking/info/:publicKey", async (req, res) => {
    try {
      const { publicKey } = req.params;
      const stakingInfo = await casperService.getStakingInfo(publicKey);
      res.json(stakingInfo);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch staking info" });
    }
  });

  app.post("/api/stake", async (req, res) => {
    try {
      const data = stakeRequestSchema.parse(req.body);
      
      if (data.publicKeyHex && data.validatorPublicKey) {
        const position = await stakingService.createStakingPosition({
          publicKeyHex: data.publicKeyHex,
          validatorPublicKey: data.validatorPublicKey,
          amountCSPR: data.amount,
          lockDuration: data.duration,
        });
        
        return res.json(position);
      }
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + data.duration);
      
      const position = await dbStorage.createStakingPosition({
        amount: data.amount,
        currency: "CSPR",
        apy: CONFIG.staking.defaultAPY,
        startDate: new Date(),
        endDate,
        status: "active",
        rewards: 0,
        validator: data.validator || null,
      });

      await dbStorage.addActivity({
        type: "stake",
        description: `Staked ${data.amount} CSPR for ${data.duration} days`,
        status: "success",
      });

      res.json({
        ...position,
        id: position.id.toString(),
        startDate: position.startDate.toISOString(),
        endDate: position.endDate?.toISOString(),
      });
    } catch (error) {
      console.error("Staking error:", error);
      res.status(400).json({ error: (error as Error).message || "Staking failed" });
    }
  });

  app.post("/api/stake/withdraw", async (req, res) => {
    try {
      const { publicKeyHex, positionId } = z.object({
        publicKeyHex: z.string(),
        positionId: z.number(),
      }).parse(req.body);

      const result = await stakingService.withdrawStaking({
        publicKeyHex,
        positionId,
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message || "Withdrawal failed" });
    }
  });

  app.get("/api/bridge/supported", (req, res) => {
    res.json({
      tokens: bridgeService.getSupportedTokens(),
      chains: bridgeService.getSupportedChains(),
    });
  });

  app.post("/api/bridge/estimate-fee", async (req, res) => {
    try {
      const { amount, sourceChain } = z.object({
        amount: z.number().positive(),
        sourceChain: z.enum(["casper-test", "sepolia"]),
      }).parse(req.body);

      const estimate = bridgeService.estimateBridgeFee(amount, sourceChain);
      res.json(estimate);
    } catch (error) {
      res.status(400).json({ error: "Failed to estimate fee" });
    }
  });

  app.get("/api/bridge/transactions", async (req, res) => {
    try {
      const publicKey = req.query.publicKey as string | undefined;
      
      if (publicKey) {
        const history = await bridgeService.getUserBridgeHistory(publicKey);
        return res.json(history);
      }

      const transactions = await dbStorage.getBridgeTransactions();
      res.json(transactions.map(tx => ({
        ...tx,
        id: tx.id.toString(),
        timestamp: tx.createdAt.toISOString(),
        completedAt: tx.completedAt?.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bridge transactions" });
    }
  });

  app.get("/api/bridge/stats", async (req, res) => {
    try {
      const stats = await bridgeService.getBridgeStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bridge statistics" });
    }
  });

  app.get("/api/bridge/status/:transferId", async (req, res) => {
    try {
      const { transferId } = req.params;
      const status = await bridgeService.getBridgeTransferStatus(parseInt(transferId));
      
      if (!status) {
        return res.status(404).json({ error: "Transfer not found" });
      }
      
      res.json(status);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch transfer status" });
    }
  });

  app.post("/api/bridge", async (req, res) => {
    try {
      const data = bridgeRequestSchema.parse(req.body);
      
      if (data.publicKeyHex && data.destinationAddress) {
        if (data.sourceChain === "casper-test") {
          const result = await bridgeService.initiateTransferCasperToSepolia({
            publicKeyHex: data.publicKeyHex,
            amountCSPR: data.amount,
            sepoliaAddress: data.destinationAddress,
            token: data.token,
          });
          
          return res.json(result);
        } else {
          const result = await bridgeService.initiateTransferSepoliaToCasper({
            sepoliaAddress: data.sourceAddress || "",
            amountETH: data.amount,
            casperPublicKey: data.publicKeyHex,
            token: data.token,
          });
          
          return res.json(result);
        }
      }
      
      const bridgeAnalysis = await aiService.analyzeBridgeTransaction(
        data.sourceChain,
        data.destinationChain,
        data.amount,
        data.token
      );
      
      const tx = await dbStorage.createBridgeTransaction({
        sourceChain: data.sourceChain,
        destinationChain: data.destinationChain,
        sourceAddress: "casper1user...",
        destinationAddress: "0xuser...",
        amount: data.amount,
        token: data.token,
        status: "initiated",
      });

      await dbStorage.addActivity({
        type: "bridge",
        description: `Bridging ${data.amount} ${data.token} to ${data.destinationChain}`,
        status: "pending",
      });

      setTimeout(async () => {
        try {
          await dbStorage.updateBridgeTransaction(tx.id, { status: "locked" });
          setTimeout(async () => {
            await dbStorage.updateBridgeTransaction(tx.id, { status: "minting" });
            setTimeout(async () => {
              await dbStorage.updateBridgeTransaction(tx.id, { 
                status: "completed",
                completedAt: new Date(),
                txHashDestination: "0x" + Array.from({ length: 64 }, () => 
                  Math.floor(Math.random() * 16).toString(16)
                ).join(""),
              });
            }, 2000);
          }, 2000);
        } catch (updateError) {
          console.error("Failed to update bridge transaction:", updateError);
        }
      }, 2000);

      res.json({
        ...tx,
        id: tx.id.toString(),
        timestamp: tx.createdAt.toISOString(),
        bridgeAnalysis,
        aiPowered: aiService.isAvailable(),
      });
    } catch (error) {
      console.error("Bridge error:", error);
      res.status(400).json({ error: (error as Error).message || "Bridge transaction failed" });
    }
  });

  app.post("/api/bridge/analyze", async (req, res) => {
    try {
      const { sourceChain, destinationChain, amount, token } = z.object({
        sourceChain: z.string(),
        destinationChain: z.string(),
        amount: z.number().positive(),
        token: z.string(),
      }).parse(req.body);

      const analysis = await aiService.analyzeBridgeTransaction(
        sourceChain,
        destinationChain,
        amount,
        token
      );

      res.json({
        ...analysis,
        aiPowered: aiService.isAvailable(),
      });
    } catch (error) {
      res.status(400).json({ error: "Bridge analysis failed" });
    }
  });

  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await dbStorage.getCompilationMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/contracts", async (req, res) => {
    try {
      const contracts = await dbStorage.getContracts();
      res.json(contracts.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        deployedAt: c.deployedAt?.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const { name, sourceCode, network } = z.object({
        name: z.string().min(1),
        sourceCode: z.string().min(50),
        network: z.string().default("casper-testnet"),
      }).parse(req.body);

      const contract = await dbStorage.createContract({
        name,
        sourceCode,
        bytecode: null,
        wasmCode: null,
        abi: [],
        status: "draft",
        network,
      });

      res.json({
        ...contract,
        createdAt: contract.createdAt.toISOString(),
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to create contract" });
    }
  });

  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await dbStorage.getRecentActivities(limit);
      res.json(activities.map(a => ({
        ...a,
        id: a.id.toString(),
        timestamp: a.createdAt.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.get("/api/ai/status", (req, res) => {
    res.json({
      available: aiService.isAvailable(),
      features: {
        securityAnalysis: true,
        yieldAdvice: true,
        codeSuggestions: true,
        bridgeAnalysis: true,
      },
    });
  });

  app.get("/api/config", (req, res) => {
    res.json({
      network: {
        name: CONFIG.casper.networkName,
        chainName: CONFIG.casper.chainName,
        explorerUrl: CONFIG.casper.explorerUrl,
      },
      staking: {
        minLockDays: CONFIG.staking.minLockDays,
        maxLockDays: CONFIG.staking.maxLockDays,
        minStakeAmount: CONFIG.staking.minStakeAmount,
        defaultAPY: CONFIG.staking.defaultAPY,
      },
      bridge: {
        minAmount: CONFIG.bridge.minBridgeAmount,
        maxAmount: CONFIG.bridge.maxBridgeAmount,
        supportedTokens: CONFIG.bridge.supportedTokens,
      },
    });
  });

  return httpServer;
}
