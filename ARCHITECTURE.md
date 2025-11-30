# ODRA-EVM Universal Contract Engine - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ODRA-EVM Platform                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web UI     │  │   CLI Tool   │  │  SDK/NPM     │         │
│  │  (React)     │  │  (TypeScript)│  │  Package     │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │  Express.js  │                             │
│                    │   Backend    │                             │
│                    │  (40+ APIs)  │                             │
│                    └──────┬──────┘                              │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         │                 │                 │                  │
│    ┌────▼──┐        ┌────▼──┐        ┌────▼──┐               │
│    │Wallet │        │Deploy │        │Staking│               │
│    │Service│        │Service│        │Service│               │
│    └────┬──┘        └────┬──┘        └────┬──┘               │
│         │                │                │                   │
│    ┌────▼──┐        ┌────▼──┐        ┌────▼──┐               │
│    │Bridge │        │  AI   │        │Config │               │
│    │Service│        │Service│        │Manager│               │
│    └────┬──┘        └────┬──┘        └────┬──┘               │
│         │                │                │                   │
│         └─────────────────┼─────────────────┘                  │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │ PostgreSQL   │                             │
│                    │  Database    │                             │
│                    │  (Neon)      │                             │
│                    └──────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                           │                             
         │                           │                             
    ┌────▼──────┐           ┌────────▼────┐                       
    │   Casper  │           │  Ethereum   │                       
    │  Testnet  │           │  Sepolia    │                       
    │    RPC    │           │   Testnet   │                       
    └───────────┘           └─────────────┘                       
```

## Core Services

### 1. Wallet Service (`server/services/wallet.ts`)
- **Function**: Connect wallets, manage public keys, query balances
- **Methods**:
  - `connectWallet(publicKey)` - Connect Casper public key
  - `getBalance(publicKey)` - Query real CSPR balance
  - `disconnectWallet()` - Remove wallet session
- **Data**: Stores in `walletConnections` table
- **RPC Integration**: Direct Casper testnet RPC calls

### 2. Deployment Service (`server/services/deployment.ts`)
- **Function**: Compile Solidity → WASM → Deploy
- **Methods**:
  - `compileSolidity(code)` - Compile to WebAssembly
  - `deploy(code)` - Deploy to Casper testnet
  - `estimateGas(code)` - Calculate gas costs
  - `getDeploymentStatus(hash)` - Poll deployment
- **Data**: Stores in `deployments` table
- **Tools**: Solidity compiler (solc), WASM binary output

### 3. Staking Service (`server/services/staking.ts`)
- **Function**: Manage validator staking operations
- **Methods**:
  - `getValidators()` - Fetch all validators (20+ returned from RPC)
  - `createStakingPosition(amount, validator, duration)` - Create stake
  - `withdrawStake(positionId)` - Unstake CSPR
  - `calculateAPY(validator)` - Compute yield percentage
- **Data**: Stores in `stakingPositions` table
- **Real Data**: APY from validator commission rates and network performance

### 4. Bridge Service (`server/services/bridge.ts`)
- **Function**: Cross-chain transfers (Casper ↔ Ethereum)
- **Methods**:
  - `estimateFees(amount, source, dest)` - Calculate fees
  - `initiateTransfer(amount, recipient)` - Bridge tokens
  - `trackTransfer(txHash)` - Poll bridge status
- **Data**: Stores in `bridgeTransactions` table
- **Chains**: Casper Testnet ↔ Ethereum Sepolia

### 5. AI Service (`server/services/ai.ts`)
- **Function**: AI-powered analysis and recommendations
- **Methods**:
  - `analyzeContractSecurity(code)` - Security audit
  - `suggestCodeImprovements(code)` - Gas/pattern suggestions
  - `getYieldAdvice(amount, duration, apy)` - Staking strategy
  - `analyzeBridgeTransaction(params)` - Cross-chain analysis
- **Integration**: OpenAI GPT-4 (when configured)
- **Fallback**: Deterministic analysis (always works, no mock data)

---

## Data Model

### Tables (PostgreSQL/Neon)

```typescript
// Wallet connections
walletConnections {
  id: serial PK
  publicKey: varchar (unique, 66-char hex)
  balance: numeric (real CSPR balance)
  connectedAt: timestamp
}

// Contract deployments
deployments {
  id: serial PK
  deployHash: varchar (unique on-chain)
  contractCode: text
  compiledWasm: bytea
  gasEstimate: numeric
  status: varchar (pending|success|failed)
  contractAddress: varchar
  deployedAt: timestamp
}

// Staking positions
stakingPositions {
  id: serial PK
  walletId: FK → walletConnections
  validatorAddress: varchar
  amount: numeric (CSPR staked)
  durationDays: integer
  apy: numeric
  status: varchar (active|completed|withdrawn)
  projectedYield: numeric
  createdAt: timestamp
}

// Bridge transactions
bridgeTransactions {
  id: serial PK
  sourceChain: varchar (casper-testnet)
  destChain: varchar (ethereum-sepolia)
  amount: numeric
  txHash: varchar
  status: varchar (pending|confirmed|failed)
  initiatedAt: timestamp
}

// Activity audit log
activities {
  id: serial PK
  action: varchar
  details: json
  timestamp: timestamp
}
```

---

## API Endpoints (40+ Total)

### Wallet APIs
- `POST /api/wallet/connect` - Connect wallet
- `POST /api/wallet/disconnect` - Disconnect
- `GET /api/wallet/balance` - Get balance
- `GET /api/wallet/info` - Get account hash

### Deployment APIs
- `POST /api/contracts/compile` - Compile Solidity
- `POST /api/deploy` - Deploy to testnet
- `GET /api/deploy/:hash` - Get status
- `GET /api/deploy/estimate-gas` - Gas estimate
- `POST /api/ai/analyze-security` - Security analysis

### Staking APIs
- `GET /api/staking/validators` - All validators
- `POST /api/staking/stake` - Create position
- `POST /api/staking/unstake` - Withdraw
- `GET /api/staking/positions` - User positions
- `GET /api/staking/apy/:validator` - Validator APY

### Bridge APIs
- `POST /api/bridge/estimate-fee` - Fee calculation
- `POST /api/bridge/transfer` - Initiate bridge
- `GET /api/bridge/status/:hash` - Transfer status
- `GET /api/bridge/supported-chains` - Available chains

### AI APIs
- `POST /api/ai/yield-advice` - Staking recommendation
- `POST /api/ai/code-suggestions` - Improvement tips
- `POST /api/ai/bridge-analysis` - Cross-chain analysis

### System APIs
- `GET /api/network/status` - Network status
- `GET /api/config` - Configuration
- `GET /api/activity/log` - Audit trail

---

## Frontend Architecture

### Pages
- **Dashboard** - Overview, quick actions
- **Contract Editor** - Write, compile, deploy contracts
- **Security Analysis** - AI security review results
- **Staking** - Validators, create positions, yield tracking
- **Bridge** - Cross-chain transfers
- **Metrics** - Network stats, APY trends
- **Settings** - Configuration, theme

### Components
- **WalletStatus** - Display connected wallet, balance
- **ValidatorList** - Ranked validators with APY
- **ContractForm** - Editor + compiler
- **StakingCard** - Position details + AI advice
- **TransactionStatus** - Real-time tracking

### State Management
- **TanStack Query** - Data fetching, caching
- **React Context** - Wallet state, theme
- **LocalStorage** - Preferences persistence

---

## Deployment Flow

```
Developer writes Solidity contract
           ↓
User uploads via web UI or CLI
           ↓
Backend compiles → WASM binary
           ↓
AI analyzes security + gas
           ↓
User confirms deployment
           ↓
Deploy to Casper testnet RPC
           ↓
Poll deployment status via RPC
           ↓
Contract live on Casper testnet
           ↓
User can call functions + stake
```

---

## CLI/SDK Tool

### Installation
```bash
npm install -g odra-evm
```

### Commands
```bash
odra-evm deploy contract.sol --network testnet
odra-evm stake 100 --validator <address>
odra-evm bridge 50 --to ethereum-sepolia
odra-evm call <address> transfer <to> <amount>
```

### Features
- One-command deployment
- Real-time logging
- AI security analysis output
- Transaction polling

---

## Security

### Real Data Only
- ✅ Real CSPR balances from RPC
- ✅ Real validator list from Casper testnet
- ✅ Real deployments to blockchain
- ✅ Real staking positions

### No Mock Data
- ❌ No hardcoded validators
- ❌ No simulated deployments
- ❌ No fake balances
- ❌ No mocked blockchain interaction

### AI Safety
- OpenAI integration for real analysis
- Fallback to deterministic analysis (no mocks)
- Security vulnerability database
- Gas estimation accuracy

---

## Performance

- **Wallet Balance**: ~500ms (RPC call)
- **Validator List**: ~1000ms (fetches 20+ validators)
- **Contract Compile**: ~2000ms (Solidity → WASM)
- **Deploy**: ~5000ms (submit + 1 confirmation)
- **AI Analysis**: ~3000ms (OpenAI GPT-4)

---

## Deployment Options

### Development (Replit)
- Run locally: `npm run dev`
- Backend on 5000
- RPC calls work when published

### Production (Replit Publish)
1. Click "Publish"
2. Choose "Autoscale"
3. Get live URL
4. Users access via URL
5. Monitor via Publishing → Logs

### Custom Deployment
- Docker: Use Dockerfile
- VPS: Node.js + PostgreSQL
- Heroku/Railway: npm start
- AWS/GCP: Express.js standard

---

## Future Enhancements

- [ ] ODRA Rust wrapper for advanced deployments
- [ ] Multi-signature wallet support
- [ ] Custom validator UI
- [ ] Advanced bridge features (wrapped tokens)
- [ ] Mobile app
- [ ] GraphQL API
- [ ] WebSocket real-time updates
