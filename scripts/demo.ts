#!/usr/bin/env ts-node

/**
 * ODRA-EVM Live Demo Script
 * Hackathon-ready end-to-end flow demonstrating all platform features
 *
 * Prerequisites:
 * 1. App is running (npm run dev)
 * 2. Set TESTNET_WALLET_KEY environment variable
 * 3. Run: npx ts-node scripts/demo.ts
 */

const API_URL = "http://localhost:5000";

interface DemoStep {
  name: string;
  description: string;
  action: () => Promise<any>;
}

async function apiCall(endpoint: string, method: string = "GET", body?: any): Promise<any> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${await response.text()}`);
  }

  return response.json();
}

function log(step: number, message: string, type: "info" | "success" | "error" | "section" = "info"): void {
  const icons = { info: "ℹ️", success: "✅", error: "❌", section: "🔷" };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${icons[type]} [${timestamp}] Step ${step}: ${message}`);
}

async function runDemo(): Promise<void> {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     ODRA-EVM Universal Contract Engine - Live Demo Flow       ║
║                     Casper Testnet                            ║
╚════════════════════════════════════════════════════════════════╝
  `);

  let stepCount = 0;
  const testnetKey = "01" + "a".repeat(64); // Mock testnet key

  const steps: DemoStep[] = [
    {
      name: "1. Connect Wallet",
      description: "Connect a Casper testnet wallet",
      action: async () => {
        stepCount++;
        log(stepCount, "Connecting wallet...", "section");

        const result = await apiCall("/api/wallet/connect", "POST", {
          publicKey: testnetKey,
        });

        log(stepCount, `Wallet connected: ${result.publicKey.slice(0, 10)}...`, "success");
        log(stepCount, `Balance: ${result.balance || 0} CSPR`);

        return result;
      },
    },

    {
      name: "2. Get Network Status",
      description: "Fetch current Casper testnet status",
      action: async () => {
        stepCount++;
        log(stepCount, "Fetching network status...", "section");

        const result = await apiCall("/api/network/status");

        log(stepCount, `Network: ${result.chainName}`, "success");
        log(stepCount, `Current Era: ${result.currentEra}`);
        log(stepCount, `Block Height: ${result.blockHeight}`);

        return result;
      },
    },

    {
      name: "3. Compile Solidity Contract",
      description: "Compile an ERC-20 to WebAssembly",
      action: async () => {
        stepCount++;
        log(stepCount, "Compiling ERC-20 to WASM...", "section");

        const erc20Code = `
pragma solidity ^0.8.0;
contract MyToken {
  uint256 public totalSupply = 1000000;
  mapping(address => uint256) public balances;
}`;

        const result = await apiCall("/api/contracts/compile", "POST", {
          sourceCode: erc20Code,
          contractName: "MyToken",
        });

        log(stepCount, "Compilation successful", "success");
        log(stepCount, `WASM size: ${result.wasmSize} bytes`);
        log(stepCount, `Gas estimate: ${result.gasEstimate} motes`);

        return result;
      },
    },

    {
      name: "4. AI Security Analysis",
      description: "Run AI-powered security analysis",
      action: async () => {
        stepCount++;
        log(stepCount, "Running AI security analysis...", "section");

        const testCode = `
function withdraw() public {
  uint balance = balances[msg.sender];
  (bool success,) = msg.sender.call{value: balance}("");
  balances[msg.sender] = 0;
}`;

        const result = await apiCall("/api/ai/analyze-security", "POST", {
          contractCode: testCode,
        });

        log(stepCount, `Analysis complete - Risk Score: ${result.riskScore}/100`, "success");
        if (result.vulnerabilities.length > 0) {
          log(stepCount, `⚠️  Found ${result.vulnerabilities.length} vulnerabilities:`, "info");
          result.vulnerabilities.forEach((v: any) => {
            log(stepCount, `  • ${v.type} (${v.severity}): ${v.description}`, "error");
          });
        } else {
          log(stepCount, "No vulnerabilities detected", "success");
        }

        return result;
      },
    },

    {
      name: "5. Get Available Validators",
      description: "Fetch list of validators from Casper testnet",
      action: async () => {
        stepCount++;
        log(stepCount, "Fetching validators from Casper testnet...", "section");

        const result = await apiCall("/api/staking/validators");

        log(stepCount, `Found ${result.length} validators`, "success");
        const top3 = result.slice(0, 3);
        top3.forEach((v: any, i: number) => {
          log(stepCount, `  ${i + 1}. ${v.name} - APY: ${v.apy}% (Commission: ${v.commission}%)`, "info");
        });

        return result;
      },
    },

    {
      name: "6. Create Staking Position",
      description: "Stake CSPR with a validator",
      action: async () => {
        stepCount++;
        log(stepCount, "Creating staking position (100 CSPR, 90 days)...", "section");

        const result = await apiCall("/api/staking/stake", "POST", {
          amount: 100,
          durationDays: 90,
          validatorIndex: 0,
        });

        log(stepCount, "Staking position created", "success");
        log(stepCount, `Position ID: ${result.id}`);
        log(stepCount, `Projected Yield: ${result.projectedYield} CSPR`);

        return result;
      },
    },

    {
      name: "7. AI Yield Advisor",
      description: "Get AI-powered staking recommendations",
      action: async () => {
        stepCount++;
        log(stepCount, "Consulting AI Yield Advisor...", "section");

        const result = await apiCall("/api/ai/yield-advice", "POST", {
          stakingAmount: 100,
          durationDays: 90,
          currentAPY: 8.5,
        });

        log(stepCount, `AI Analysis Complete`, "success");
        log(stepCount, `Projected Yield: ${result.projectedYield} CSPR`, "info");
        log(stepCount, `Optimal Strategy: "${result.recommendation}"`, "info");
        log(stepCount, `Compounding Schedule: ${result.compoundingSchedule}`, "info");
        result.strategies.forEach((s: string) => {
          log(stepCount, `  💡 ${s}`, "info");
        });

        return result;
      },
    },

    {
      name: "8. Bridge to Ethereum Sepolia",
      description: "Initiate cross-chain transfer of cCSPR",
      action: async () => {
        stepCount++;
        log(stepCount, "Estimating bridge fees (50 cCSPR → Ethereum Sepolia)...", "section");

        const estimate = await apiCall("/api/bridge/estimate-fee", "POST", {
          amount: 50,
          sourceChain: "casper-testnet",
          destinationChain: "ethereum-sepolia",
          token: "cCSPR",
        });

        log(stepCount, `Bridge Fee: ${estimate.fee} cCSPR`, "success");
        log(stepCount, `You receive: ${50 - estimate.fee} w-cCSPR`, "info");
        log(stepCount, `Estimated Time: ${estimate.estimatedTime}`, "info");

        const result = await apiCall("/api/bridge/transfer", "POST", {
          amount: 50,
          sourceChain: "casper-testnet",
          destinationChain: "ethereum-sepolia",
          recipientAddress: "0x" + "b".repeat(40),
        });

        log(stepCount, "Bridge transfer initiated", "success");
        log(stepCount, `Transaction Hash: ${result.txHash}`, "info");
        log(stepCount, `Status: ${result.status}`, "info");

        return result;
      },
    },

    {
      name: "9. Get Activity Log",
      description: "View audit trail of all operations",
      action: async () => {
        stepCount++;
        log(stepCount, "Fetching activity log...", "section");

        const result = await apiCall("/api/activity/log?limit=5");

        log(stepCount, `Found ${result.activities.length} activities`, "success");
        result.activities.forEach((a: any, i: number) => {
          log(stepCount, `  ${i + 1}. ${a.action} - ${a.timestamp}`, "info");
        });

        return result;
      },
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const step of steps) {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`📋 ${step.name}`);
    console.log(`   ${step.description}`);
    console.log("═".repeat(70));

    try {
      await step.action();
      successCount++;
    } catch (error) {
      log(stepCount, `FAILED: ${error}`, "error");
      errorCount++;
    }

    // Delay between steps for readability
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log(`\n${"═".repeat(70)}`);
  console.log(`\n📊 Demo Summary:\n`);
  console.log(`   ✅ Successful Steps: ${successCount}`);
  console.log(`   ❌ Failed Steps: ${errorCount}`);
  console.log(`   📈 Success Rate: ${((successCount / steps.length) * 100).toFixed(1)}%`);

  if (errorCount === 0) {
    console.log(`\n🎉 All systems operational! Ready for production deployment.`);
  } else {
    console.log(`\n⚠️  Some steps failed. Check logs above for details.`);
  }

  console.log(`\n${"═".repeat(70)}\n`);
}

runDemo().catch((error) => {
  console.error("❌ Demo failed:", error);
  process.exit(1);
});
