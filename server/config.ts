export const CONFIG = {
  casper: {
    chainName: "casper-test",
    networkName: "casper-testnet",
    rpcEndpoints: [
      "https://rpc.testnet.casperlabs.io/rpc",
      "https://node-clarity-testnet.make.services/rpc",
    ],
    statusEndpoint: "https://rpc.testnet.casperlabs.io/status",
    explorerUrl: "https://testnet.cspr.live",
    baseGasCost: 2_500_000_000,
    perByteCost: 1_000,
    minStakeAmount: 5_000_000_000_000,
    minStakeCSPR: 5,
    motesToCSPR: 1_000_000_000,
  },

  sepolia: {
    chainId: 11155111,
    rpcEndpoint: process.env.SEPOLIA_RPC_ENDPOINT || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    explorerUrl: "https://sepolia.etherscan.io",
    confirmations: 6,
  },

  staking: {
    inflationRate: 0.02,
    minLockDays: 7,
    maxLockDays: 365,
    minStakeAmount: 5,
    defaultAPY: 8.5,
  },

  bridge: {
    feeCasperToEth: 0.5,
    feeEthToCasper: 0.75,
    minBridgeAmount: 0.1,
    maxBridgeAmount: 10000,
    supportedTokens: ["CSPR", "ETH", "USDC"],
  },

  polling: {
    deploymentInterval: 5000,
    balanceRefreshInterval: 30000,
    bridgeStatusInterval: 10000,
    stakingRewardsInterval: 60000,
    rpcTimeout: 30000,
    maxDeploymentAttempts: 120,
  },

  publicKeyFormats: {
    ed25519Prefix: "01",
    secp256k1Prefix: "02",
    expectedLength: 66,
  },
};

export function getExplorerDeployUrl(deployHash: string): string {
  return `${CONFIG.casper.explorerUrl}/deploy/${deployHash}`;
}

export function getExplorerAccountUrl(accountHash: string): string {
  return `${CONFIG.casper.explorerUrl}/account/${accountHash}`;
}

export function getExplorerBlockUrl(blockHash: string): string {
  return `${CONFIG.casper.explorerUrl}/block/${blockHash}`;
}

export function motesToCSPR(motes: string | bigint): number {
  const motesValue = typeof motes === "string" ? BigInt(motes) : motes;
  return Number(motesValue) / CONFIG.casper.motesToCSPR;
}

export function csprToMotes(cspr: number): string {
  return (BigInt(Math.floor(cspr * CONFIG.casper.motesToCSPR))).toString();
}

export function validatePublicKey(publicKeyHex: string): { valid: boolean; keyType: string | null; error?: string } {
  if (publicKeyHex.length !== CONFIG.publicKeyFormats.expectedLength) {
    return { valid: false, keyType: null, error: "Invalid public key length" };
  }

  const prefix = publicKeyHex.substring(0, 2);
  
  if (prefix === CONFIG.publicKeyFormats.ed25519Prefix) {
    return { valid: true, keyType: "ed25519" };
  } else if (prefix === CONFIG.publicKeyFormats.secp256k1Prefix) {
    return { valid: true, keyType: "secp256k1" };
  }

  return { valid: false, keyType: null, error: "Invalid public key prefix" };
}

export function estimateGasCost(wasmSizeBytes: number): { costInMotes: string; costInCSPR: number } {
  const baseCost = BigInt(CONFIG.casper.baseGasCost);
  const sizeCost = BigInt(wasmSizeBytes) * BigInt(CONFIG.casper.perByteCost);
  const totalMotes = baseCost + sizeCost;
  
  return {
    costInMotes: totalMotes.toString(),
    costInCSPR: Number(totalMotes) / CONFIG.casper.motesToCSPR,
  };
}
