# ODRA-EVM Universal Contract Engine - Testnet Integration Guide

## Project Understanding

### What This App Does
ODRA-EVM is a **blockchain development platform** that enables developers to:
1. **Write & Compile** Solidity smart contracts to WebAssembly (Wasm)
2. **Deploy** contracts to Casper testnet blockchain
3. **Analyze** contracts for security vulnerabilities using AI
4. **Stake** CSPR tokens on validators to earn rewards
5. **Bridge** assets between Casper and Ethereum (Sepolia) testnet

### Current State
- ✅ UI fully functional with all pages (Dashboard, Editor, Security, Staking, Bridge)
- ✅ Backend routes connected to database
- ✅ Mock data displayed throughout app
- ✅ Compilation working (Solidity → Wasm)
- ✅ Database (PostgreSQL) integrated
- ✅ Casper RPC endpoints configured with fallback
- ❌ **NO REAL BLOCKCHAIN INTERACTIONS** - Everything is mock/demo data

---

## What Needs to Be Live on Testnet

### 1. WALLET CONNECTION & AUTHENTICATION
**What's Needed:**
- Casper Wallet integration (user connects their wallet)
- Public key + account hash capture
- Balance fetching from real testnet
- Transaction signing capability

**Files to Create/Modify:**
- `client/src/pages/wallet-connect.tsx` - New page for wallet connection
- `server/services/wallet.ts` - Wallet interaction service
- `client/src/hooks/use-wallet.ts` - React hook for wallet state

**Key Features:**
```
- "Connect Wallet" button in header
- Display connected account address
- Show real CSPR balance from testnet
- Enable/disable features based on connection
```

---

### 2. REAL CONTRACT DEPLOYMENTS
**What's Needed:**
- Compile contract to Wasm (already works)
- Sign deployment with wallet
- Submit to Casper testnet RPC
- Track deployment hash and status
- Poll blockchain for confirmation

**Implementation Steps:**
1. Create deployment request endpoint: `POST /api/deploy`
2. Accept: compiled Wasm code + wallet signature
3. Calculate gas cost estimate
4. Submit to Casper testnet via RPC
5. Store deployment hash in database
6. Poll for confirmation status

**Database Schema Addition:**
```typescript
deployments table:
- id, contractId, deployHash, status (pending/confirmed/failed)
- userPublicKey, timestamp, gasUsed, blockHeight
```

---

### 3. REAL STAKING OPERATIONS
**What's Needed:**
- List live validators from Casper testnet
- Allow user to delegate CSPR to validators
- Sign stake transaction with wallet
- Track active stakes
- Calculate real APY based on network data
- Show reward accumulation

**Implementation Steps:**
1. Fetch validators: `casperService.getValidators()` (already exists)
2. Create stake endpoint: `POST /api/stake/delegate`
3. Accept: amount, validator, lock duration
4. Sign and submit delegation tx
5. Store in database with status
6. Poll for confirmation

**Database Schema Addition:**
```typescript
staking_positions table:
- id, userId, validatorPublicKey, amount, status
- lockDuration, startDate, endDate, rewards, apy
```

---

### 4. CROSS-CHAIN BRIDGE
**What's Needed:**
- User selects source chain (Casper testnet) and destination (Sepolia)
- Approve token transfer on source
- Lock tokens on source chain
- Mint equivalent on destination
- Confirm receipt on destination

**Implementation Steps:**
1. Create bridge contract interaction service
2. Sepolia testnet RPC setup
3. Bridge endpoint: `POST /api/bridge/transfer`
4. Sign on source chain
5. Wait for lock confirmation
6. Submit unlock/mint on destination
7. Track status in database

---

### 5. REAL SECURITY ANALYSIS
**What's Needed:**
- When contract deployed, run real analysis
- Use AI (OpenAI - provide key when ready)
- Detect real vulnerabilities in bytecode
- Store results with severity levels
- Show findings in UI

**Currently Uses:** Fallback rule-based analysis (detects reentrancy, overflow, access control issues)

---

## Technical Architecture for Real Testnet

### Backend Service Layer

#### `server/services/wallet.ts` (NEW)
```typescript
- connectWallet(publicKeyHex: string)
- signTransaction(tx: any): Promise<signature>
- getWalletInfo(): WalletInfo with real balance
- disconnectWallet()
```

#### `server/services/deployment.ts` (NEW)
```typescript
- deployContract(wasmCode, signature, deployArgs)
- getDeploymentStatus(deployHash)
- estimateDeploymentCost(wasmSize)
- monitorDeployment(deployHash): poll until confirmed
```

#### `server/services/staking.ts` (EXPAND)
```typescript
- getAllValidators() - Get live validator list
- delegateToValidator(amount, validator, signature)
- getStakingStatus(publicKey) - Real stakes
- calculateAPY(validator) - Real network APY
- withdrawStake(stakeId, signature)
```

#### `server/services/bridge.ts` (NEW)
```typescript
- initiateTransfer(amount, sourceChain, destChain, signature)
- confirmTransfer(txHash, sourceChain)
- getTransferStatus(txHash)
- estimateBridgeFee(amount)
```

### API Endpoints to Implement

```
POST   /api/wallet/connect           - Connect wallet
POST   /api/wallet/disconnect        - Disconnect
GET    /api/wallet/balance           - Get real balance (already exists)

POST   /api/deploy                   - Submit real deployment
GET    /api/deploy/:hash             - Get deployment status
GET    /api/deployments              - List user's deployments

POST   /api/stake/delegate           - Real stake delegation
POST   /api/stake/withdraw           - Withdraw stake
GET    /api/stake/positions          - Get user stakes
GET    /api/stake/validators         - Live validators (already exists)

POST   /api/bridge/transfer          - Real cross-chain transfer
GET    /api/bridge/status/:txHash    - Bridge tx status
```

### Frontend Components to Update

#### `client/src/pages/editor.tsx`
- Add "Deploy to Testnet" button (instead of mock deploy)
- Show deployment status with real hash
- Link to testnet block explorer

#### `client/src/pages/staking.tsx`
- Load real validators from API
- Show real user balance
- Real stake/unstake forms with signing

#### `client/src/pages/bridge.tsx`
- Select source/destination chains
- Real token transfer with signing
- Show bridge transaction status

#### `client/src/components/wallet-status.tsx` (NEW)
- Header component showing connected wallet
- Display real balance
- Connect/disconnect buttons

---

## Database Schema Updates Needed

### New Tables Required

```typescript
// Deployments table
export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  contractId: serial("contract_id"),
  deployHash: varchar("deploy_hash").unique(),
  userPublicKey: varchar("user_public_key"),
  status: varchar("status"), // pending, confirmed, failed
  gasUsed: bigint("gas_used"),
  blockHeight: integer("block_height"),
  timestamp: timestamp("timestamp").defaultNow(),
  wasmCodeHash: varchar("wasm_code_hash"),
});

// Staking positions table
export const stakingPositions = pgTable("staking_positions", {
  id: serial("id").primaryKey(),
  userPublicKey: varchar("user_public_key"),
  validatorPublicKey: varchar("validator_public_key"),
  amount: varchar("amount"), // in motes
  amountCSPR: numeric("amount_cspr"),
  status: varchar("status"), // active, pending, unstaking
  lockDuration: integer("lock_duration"), // days
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  rewards: varchar("rewards"),
  apy: numeric("apy"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Bridge transactions table
export const bridgeTransactions = pgTable("bridge_transactions", {
  id: serial("id").primaryKey(),
  userPublicKey: varchar("user_public_key"),
  sourceChain: varchar("source_chain"), // casper-test, sepolia
  destChain: varchar("dest_chain"),
  amount: varchar("amount"),
  sourceTxHash: varchar("source_tx_hash"),
  destTxHash: varchar("dest_tx_hash"),
  status: varchar("status"), // initiated, locked, released, completed, failed
  timestamp: timestamp("timestamp").defaultNow(),
});

// Wallet sessions table (optional - for tracking user sessions)
export const walletSessions = pgTable("wallet_sessions", {
  id: serial("id").primaryKey(),
  publicKey: varchar("public_key").unique(),
  accountHash: varchar("account_hash"),
  lastConnected: timestamp("last_connected").defaultNow(),
  nonce: varchar("nonce"), // For message signing
});
```

---

## Integration Checklist for Autonomous Agent

### Phase 1: Wallet Integration
- [ ] Create wallet service (`server/services/wallet.ts`)
- [ ] Create wallet hook (`client/src/hooks/use-wallet.ts`)
- [ ] Create wallet status component
- [ ] Add wallet connect/disconnect endpoints
- [ ] Update database schema for wallet sessions
- [ ] Test with Casper testnet wallet

### Phase 2: Real Deployments
- [ ] Create deployment service
- [ ] Implement `POST /api/deploy` endpoint
- [ ] Update editor page to use real deployments
- [ ] Add deployment status polling
- [ ] Create deployment history view
- [ ] Test with actual Wasm contract

### Phase 3: Real Staking
- [ ] Expand staking service
- [ ] Implement delegation endpoint
- [ ] Update staking UI with real validators
- [ ] Add withdrawal functionality
- [ ] Implement APY calculation from network
- [ ] Test stake/unstake operations

### Phase 4: Cross-Chain Bridge
- [ ] Create bridge service for Casper and Sepolia
- [ ] Implement bridge endpoints
- [ ] Create bridge UI interactions
- [ ] Add fee estimation
- [ ] Test with testnet transfers

### Phase 5: Testing & Polish
- [ ] Test full workflows end-to-end
- [ ] Error handling for failed transactions
- [ ] Network error resilience
- [ ] Update dashboard with real data
- [ ] Performance optimization

---

## Key Technical Details

### Casper Testnet Info
- **RPC Endpoints:**
  - https://rpc.testnet.casperlabs.io/rpc
  - https://node-clarity-testnet.make.services/rpc
- **Block Explorer:** testnet.cspr.live
- **Faucet:** testnet.cspr.live (request tokens)
- **Network Name:** casper-test
- **Gas Estimation:** 2.5 CSPR base + 0.001 CSPR per byte of Wasm

### Sepolia Testnet Info
- **RPC Endpoint:** https://sepolia.infura.io/v3/{INFURA_KEY}
- **Block Explorer:** sepolia.etherscan.io
- **Faucet:** sepolia-faucet.pk910.de
- **Chain ID:** 11155111

### Transaction Flow Examples

#### Deploy Contract Flow
```
1. User compiles contract (Solidity → Wasm)
2. User clicks "Deploy to Testnet"
3. System creates deploy payload
4. User signs with wallet (browser prompts)
5. Signed tx submitted to Casper RPC
6. Deploy hash received
7. Poll every 5s for confirmation
8. Store deployment in database when confirmed
9. Show success with block explorer link
```

#### Staking Flow
```
1. User selects validator from live list
2. User enters stake amount
3. User selects lock duration (7-365 days)
4. Wallet signs delegation message
5. Submit to Casper staking contract
6. Poll for confirmation
7. Store staking position in database
8. Update dashboard with rewards

```

---

## Environment Variables Needed
```
DATABASE_URL=postgres://...  (already set)
CASPER_RPC_ENDPOINT_PRIMARY=https://rpc.testnet.casperlabs.io/rpc
CASPER_RPC_ENDPOINT_FALLBACK=https://node-clarity-testnet.make.services/rpc
SEPOLIA_RPC_ENDPOINT=https://sepolia.infura.io/v3/{KEY}
OPENAI_API_KEY=sk-... (optional, for AI analysis)
```

---

## Testing Strategy

### Local Testing
1. Connect to testnet wallet (test account with tokens from faucet)
2. Deploy test contracts and verify blockchain
3. Test staking with small amounts
4. Verify database records for each operation

### Monitoring
- Dashboard should show real data from testnet
- Recent activity should reflect actual blockchain events
- All metrics should update from live network

---

## Success Criteria - App is "Live on Testnet" When:

✅ Users can connect real Casper wallet  
✅ Deploy contracts and see real transaction hash on explorer  
✅ Stake tokens and see active position with real validator  
✅ Earn real rewards from staking  
✅ Bridge assets to/from Sepolia  
✅ All dashboard metrics reflect real testnet data  
✅ Security analysis runs on compiled contracts  

---

## Notes for Autonomous Agent

- Current codebase has good structure; reuse existing patterns
- Database already configured; just need new tables
- RPC integration already partially done; extend it
- Frontend components exist; enhance them with real functionality
- Focus on error handling - blockchain operations can fail
- Implement transaction polling correctly (confirmations matter)
- Store everything in database for audit trail
- Add user feedback (toasts) for all blockchain operations
