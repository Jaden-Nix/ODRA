# Example Solidity Contracts for Casper Testnet

These example contracts demonstrate deployment via ODRA-EVM to Casper Testnet.

## Contracts

### ERC20.sol
- Standard ERC-20 token (ODRA Token)
- Features: Transfer, Approve, TransferFrom
- Use case: Token creation and trading
- Compile & deploy: `odra-evm deploy ERC20.sol`

### ERC721.sol
- Standard ERC-721 NFT contract
- Features: Mint, Transfer, Approve
- Use case: NFT/digital collectible creation
- Compile & deploy: `odra-evm deploy ERC721.sol`

### LiquidStaking.sol
- cCSPR Liquid Staking Contract
- Features: Stake CSPR → Receive cCSPR, Compound rewards
- APY: 8.5% (configurable)
- Unbonding: 7 days
- Use case: Liquid staking without validator delegation complexity

## Deployment Flow

```bash
# 1. Compile Solidity → WebAssembly
solc ERC20.sol --optimize --bin

# 2. Deploy via CLI
odra-evm deploy ERC20.sol --network testnet

# 3. Get deployment hash and track on explorer
# https://testnet.cspr.live/deploy/HASH

# 4. Call contract functions
odra-evm call <contract-address> transfer <recipient> <amount>
```

## On-Chain Validation

After deployment, verify on Casper Testnet:
- View contract: https://testnet.cspr.live/contract
- Query balance: `casper-client query-state -n testnet`
- View transfers: Casper Explorer transactions

## AI-Powered Review

All deployments receive AI analysis:
- Security vulnerabilities
- Gas optimization suggestions
- Casper compatibility patterns
- Best practice recommendations

See: `POST /api/ai/analyze-security`
