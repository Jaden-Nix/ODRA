# ODRA-EVM Universal Contract Engine

## Project Status: REAL BLOCKCHAIN DATA ONLY - NO MOCKS

Full-stack blockchain platform with **direct Casper testnet integration**. All data comes from real chain - no fallbacks, no simulations.

### Casper RPC Configuration
- **Primary**: `https://node.testnet.casper.network/rpc`
- **Fallback**: `https://rpc.testnet.casperlabs.io/rpc`
- **Status**: `https://node.testnet.casper.network:8888/status`

### Services (Real Chain Calls Only)
1. **Wallet** - Direct RPC balance queries, account hash derivation
2. **Deployment** - Real contract deployment polling to testnet
3. **Staking** - Real validator auction state from chain
4. **Bridge** - Cross-chain transfer tracking
5. **Network** - Real block height, era, peer count from RPC

### API Behavior
- **RPC Available** → Return real blockchain data
- **RPC Unavailable** → HTTP 503 with error (NO mock fallback)

### Database Schema
- `walletConnections` - publicKey, accountHash, networkId, balance
- `deployments` - deployHash, userPublicKey, status, blockHeight, blockHash
- `stakingPositions` - amount, APY, validator, lockDuration
- `bridgeTransactions` - sourceChain, destChain, amount, status
- `activities` - audit log

### API Endpoints (40+)
- `/api/wallet/*` - Real RPC queries
- `/api/network/status` - Real block data
- `/api/network/validators` - Real auction state
- `/api/deploy` - Real deployment polling
- `/api/stake` - Real staking with validators
- `/api/bridge` - Cross-chain transfers
- `/api/compile` - Solidity → WASM
- `/api/analyze` - Security analysis

### Configuration
**Network**: Casper Testnet  
**Min Stake**: 5 CSPR | **Max Lock**: 365 days  
**Bridge Fees**: 0.5% (CSPR→ETH) / 0.75% (ETH→CSPR)  

### To Run
```bash
npm run dev        # Connects to real testnet RPC
NODE_ENV=production npm run build
npm start
```

### Important
- Zero mock data - all validators, balances, transactions from real chain
- RPC errors return 503, not fallback data
- Works when deployed with internet access to testnet
- Real data persists in PostgreSQL
