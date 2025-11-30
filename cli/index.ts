#!/usr/bin/env node

/**
 * ODRA-EVM CLI Tool
 * One-command deployment and management for Casper Testnet
 *
 * Usage:
 *   odra-evm deploy <contract.sol> --network testnet
 *   odra-evm stake <amount> --validator <address>
 *   odra-evm call <contract> <function> <args...>
 *   odra-evm bridge <amount> --to <destination>
 */

import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

interface CliConfig {
  apiUrl: string;
  network: string;
  walletKey?: string;
}

const config: CliConfig = {
  apiUrl: process.env.API_URL || "https://your-app.replit.dev",
  network: process.env.NETWORK || "testnet",
};

async function apiCall(endpoint: string, method: string = "GET", body?: any): Promise<any> {
  const url = `${config.apiUrl}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to call ${endpoint}:`, error);
    process.exit(1);
  }
}

async function compileSolidity(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const solc = spawn("solc", [filePath, "--optimize", "--bin"]);
    let stdout = "";
    let stderr = "";

    solc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    solc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    solc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Solidity compilation failed:\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function deploy(contractPath: string, args: string[]): Promise<void> {
  const networkFlag = args.find((a) => a === "--network");
  const networkIndex = args.indexOf(networkFlag || "");
  const network = networkIndex !== -1 ? args[networkIndex + 1] : "testnet";

  console.log(`\n📦 Deploying contract: ${contractPath}`);
  console.log(`🌐 Network: ${network}`);

  if (!fs.existsSync(contractPath)) {
    console.error(`❌ Contract file not found: ${contractPath}`);
    process.exit(1);
  }

  try {
    // Read contract
    const contractCode = fs.readFileSync(contractPath, "utf-8");
    console.log(`✅ Contract read successfully (${contractCode.length} bytes)`);

    // Compile to Wasm
    console.log(`⚙️  Compiling Solidity → WebAssembly...`);
    const wasmBinary = await compileSolidity(contractPath);
    console.log(`✅ Compilation successful`);

    // Call API to deploy
    console.log(`📡 Deploying to Casper ${network}...`);
    const result = await apiCall("/api/deploy", "POST", {
      contractCode,
      contractName: path.basename(contractPath, ".sol"),
      network,
    });

    console.log(`✅ Deployment initiated!`);
    console.log(`\n📋 Deployment Details:`);
    console.log(`   Hash: ${result.deployHash}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Explorer: ${result.explorerLink}`);
    console.log(`\n💡 AI Security Analysis:`);
    result.securityAnalysis?.vulnerabilities?.forEach((v: any) => {
      console.log(`   ⚠️  ${v.type}: ${v.description}`);
    });

    console.log(`\n✨ Deploy success! Track deployment on Casper explorer.`);
  } catch (error) {
    console.error(`❌ Deployment failed:`, error);
    process.exit(1);
  }
}

async function stake(amount: string, args: string[]): Promise<void> {
  const validatorFlag = args.find((a) => a === "--validator");
  const validatorIndex = args.indexOf(validatorFlag || "");
  const validatorAddr = validatorIndex !== -1 ? args[validatorIndex + 1] : undefined;

  console.log(`\n💰 Staking ${amount} CSPR`);
  if (validatorAddr) console.log(`👤 Validator: ${validatorAddr}`);

  try {
    // Get validators list
    const validators = await apiCall("/api/staking/validators");
    console.log(`✅ Found ${validators.length} validators`);

    // Create staking position
    const result = await apiCall("/api/staking/stake", "POST", {
      amount: parseFloat(amount),
      validator: validatorAddr || validators[0].publicKey,
      durationDays: 90,
    });

    console.log(`✅ Staking successful!`);
    console.log(`\n📊 Staking Details:`);
    console.log(`   Position ID: ${result.id}`);
    console.log(`   Amount: ${result.amount} CSPR`);
    console.log(`   Validator: ${result.validator.name}`);
    console.log(`   APY: ${result.validator.apy}%`);
    console.log(`   Projected Yield: ${result.projectedYield} CSPR`);

    // AI Yield Advisor
    console.log(`\n🤖 AI Yield Advisor:`);
    console.log(`   "${result.aiAdvice}"`);
  } catch (error) {
    console.error(`❌ Staking failed:`, error);
    process.exit(1);
  }
}

async function call(contractAddr: string, functionName: string, args: string[]): Promise<void> {
  console.log(`\n📞 Calling ${functionName} on ${contractAddr.slice(0, 10)}...`);

  try {
    const result = await apiCall("/api/contracts/call", "POST", {
      contractAddress: contractAddr,
      function: functionName,
      args,
    });

    console.log(`✅ Call successful!`);
    console.log(`\n📤 Result:`, result.data);
  } catch (error) {
    console.error(`❌ Call failed:`, error);
    process.exit(1);
  }
}

async function bridge(amount: string, args: string[]): Promise<void> {
  const toFlag = args.find((a) => a === "--to");
  const toIndex = args.indexOf(toFlag || "");
  const destination = toIndex !== -1 ? args[toIndex + 1] : "ethereum-sepolia";

  console.log(`\n🌉 Bridging ${amount} cCSPR → ${destination}`);

  try {
    // Estimate fees
    const estimate = await apiCall("/api/bridge/estimate-fee", "POST", {
      amount: parseFloat(amount),
      sourceChain: "casper-testnet",
      destinationChain: destination,
    });

    console.log(`\n💵 Bridge Fees:`);
    console.log(`   Fee: ${estimate.fee} cCSPR`);
    console.log(`   You receive: ${parseFloat(amount) - estimate.fee} tokens`);
    console.log(`   Time: ${estimate.estimatedTime}`);

    // Initiate bridge
    const result = await apiCall("/api/bridge/transfer", "POST", {
      amount: parseFloat(amount),
      sourceChain: "casper-testnet",
      destinationChain: destination,
    });

    console.log(`\n✅ Bridge initiated!`);
    console.log(`   TX Hash: ${result.txHash}`);
    console.log(`   Status: ${result.status}`);
  } catch (error) {
    console.error(`❌ Bridge failed:`, error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔷 ODRA-EVM CLI - Casper Testnet Developer Tool

Usage:
  odra-evm deploy <contract.sol>           Deploy contract to testnet
  odra-evm stake <amount> --validator <v>  Stake CSPR with validator
  odra-evm call <contract> <func> <args>   Call deployed contract
  odra-evm bridge <amount> --to <chain>    Bridge to Ethereum Sepolia

Examples:
  odra-evm deploy MyToken.sol --network testnet
  odra-evm stake 100 --validator 01abc...
  odra-evm bridge 50 --to ethereum-sepolia

Learn more: https://docs.casper.network
    `);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case "deploy":
        await deploy(args[1], args.slice(2));
        break;
      case "stake":
        await stake(args[1], args.slice(2));
        break;
      case "call":
        await call(args[1], args[2], args.slice(3));
        break;
      case "bridge":
        await bridge(args[1], args.slice(2));
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
