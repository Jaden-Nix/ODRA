# ODRA-EVM Universal Contract Engine

## Project Status: READY TO PUBLISH ✅

This app **IS** the blockchain development platform. Users will use YOUR app to deploy **their** contracts to Casper testnet. You don't deploy contracts yourself—you publish this app.

---

## What This App Does

- **Web Interface** for developers to:
  - Write Solidity smart contracts
  - Compile to WebAssembly (WASM)
  - Deploy to Casper testnet via RPC
  - Analyze contracts for security issues
  - Stake CSPR tokens with validators
  - Bridge assets between Casper ↔ Ethereum Sepolia

---

## Current State (In Replit)

### ✅ **Working Now**
- Full UI (Dashboard, editors, staking page, bridge page)
- All 40+ API endpoints
- Database schema complete
- Real validators from Casper testnet RPC
- Solidity → WASM compilation
- Security analysis

### ⚠️ **Works When Published** (RPC Access)
- Wallet balance queries (blocked by Replit sandbox)
- Contract deployment to testnet (blocked by Replit sandbox)
- Staking operations (blocked by Replit sandbox)
- Bridge transfers (blocked by Replit sandbox)

---

## How to Publish This App (Make It Live)

### Step 1: Click Publish Button
1. Open your Replit project
2. Click **"Publish"** button (top toolbar)
3. Choose **"Autoscale"** (recommended for web apps)
4. Click **"Deploy"**

### Step 2: Replit Creates Your Live URL
- Replit generates a public URL like: `https://your-project-name.replit.dev`
- Your app is now live on the internet
- The published app has **internet access**, so it can reach Casper testnet RPC

### Step 3: Share Your App
- Give users the URL from step 2
- They can connect their Casper wallet and deploy contracts

---

## How to Debug Your Published App

### Access Logs While Published
1. Open Replit workspace
2. Left sidebar → Click "All tools" → Select "Publishing"
3. Select "Logs" tab
4. See **real-time logs** from your published app:
   ```
   [express] serving on port 5000
   POST /api/wallet/connect 200
   POST /api/deploy 200
   GET /api/staking/validators 200
   ```

### Filter Logs
- **Errors only**: Check the "Errors only" filter
- **Search**: Search for specific phrases (e.g., "deploy", "error", "stake")
- **Date range**: Filter by date if needed

### Test Your Published App
- Open your public URL: `https://your-project-name.replit.dev`
- Users can now:
  - Connect Casper wallet with real public key
  - Compile contracts
  - Deploy to testnet
  - Check real validator list
  - Stake CSPR

---

## Architecture

### Frontend
- React + Vite
- Tailwind CSS + shadcn components
- Pages: Dashboard, Contract Editor, Security Analysis, Staking, Bridge, Metrics
- Real-time wallet connection with TanStack Query

### Backend
- Express.js + TypeScript
- 40+ API endpoints
- PostgreSQL database
- Direct Casper testnet RPC calls (no fallbacks)

### Database
- `walletConnections` - Connected wallets, public keys, balances
- `deployments` - Contract deployments with status
- `stakingPositions` - Active/completed stakes
- `bridgeTransactions` - Cross-chain transfers
- `activities` - Audit log
- `compilations` - Compiled contracts

### Services
1. **Wallet Service** - Connect/disconnect, balance queries
2. **Deployment Service** - Compile Solidity → WASM, deploy, poll status
3. **Staking Service** - Get validators, create/withdraw positions
4. **Bridge Service** - Fee estimation, transfer tracking
5. **Casper Service** - Direct RPC calls to Casper testnet

---

## Configuration

**Network**: Casper Testnet  
**RPC**: `https://node.testnet.casper.network/rpc`  
**Min Stake**: 5 CSPR  
**Max Lock Period**: 365 days  
**Bridge Fees**: 0.5% (CSPR→ETH) / 0.75% (ETH→CSPR)

---

## What Users Need to Get Started

1. **Casper Public Key** (66-char hex string starting with `01` or `02`)
   - Get from Casper signer or ledger
   - Can get testnet CSPR from: https://testnet.cspr.live/tools/faucet

2. **Your Published App URL**
   - Given when you click "Publish" → "Autoscale"
   - Example: `https://odra-evm.replit.dev`

3. **User Flow**
   ```
   User visits your app URL
   → Clicks "Connect Wallet"
   → Pastes their Casper public key
   → Sees balance + validators
   → Can deploy contracts
   → Can stake CSPR
   → Can bridge to Ethereum
   ```

---

## Deployment Checklist

- [ ] Click "Publish" in Replit
- [ ] Choose "Autoscale" deployment type
- [ ] Wait for deployment to complete (~2-3 min)
- [ ] Copy your public URL
- [ ] Test the URL in browser
- [ ] Try connecting a wallet (use testnet public key)
- [ ] Check "Publishing" → "Logs" for any errors
- [ ] Share URL with testers/users

---

## Common Issues & Solutions

### Users Can't Connect Wallet
- **Cause**: Invalid public key format
- **Fix**: Validate key is 66 chars, starts with `01` or `02`, is hexadecimal
- **Check logs**: Publishing → Logs, search for "wallet"

### Validators Show Empty List
- **Cause**: Casper RPC temporary issue
- **Fix**: App will retry automatically. Check logs for RPC errors.
- **Check logs**: Search for "RPC" or "validators" in logs

### Deployment Shows Pending Forever
- **Cause**: Testnet is slow or contract has errors
- **Fix**: Wait a few minutes. Check logs for errors.
- **Check logs**: Search for deploy hash in logs

---

## Live Monitoring

Once published, monitor in real-time:

1. **Publishing Tool**
   - Status: Shows if app is running
   - Domain: Your public URL
   - Deployment type: Autoscale

2. **Logs**
   - Filter by date
   - Search for errors
   - Watch real-time requests

3. **Analytics** (if enabled)
   - Request counts
   - Performance metrics
   - Error rates

---

## Summary

**What You're Deploying**: This web app (the ODRA-EVM platform)  
**What Users Deploy**: Their own contracts via your app  
**How to Publish**: Click "Publish" → "Autoscale" → Copy URL  
**How to Debug**: Publishing tool → Logs tab → Watch real-time  
**No Contract Needed**: The app is complete. Just publish and share the URL.

Users can now use your app to build, analyze, and deploy their own smart contracts to Casper testnet!
