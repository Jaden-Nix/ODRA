# Quick Start: Publishing Your ODRA-EVM App

## 1. Click Publish (Top Toolbar)
Your Replit workspace has a "Publish" button in the top toolbar.

## 2. Choose Autoscale
- This automatically scales based on traffic
- Perfect for web apps like this
- Pay only for what you use

## 3. Deploy
Click deploy and wait 2-3 minutes.

## 4. You Get a Live URL
Example: `https://odra-evm-xyz123.replit.dev`

## 5. Share That URL
Send it to users. They can:
- Connect with Casper public key
- Compile Solidity contracts
- Deploy to testnet
- Stake CSPR
- Bridge to Ethereum

## Debug Your Live App

**In Replit:**
1. Left sidebar → "All tools" 
2. Select "Publishing"
3. Click "Logs" tab
4. See real-time logs from your published app

**Common Log Patterns:**
```
[express] serving on port 5000          ← App started ✅
POST /api/wallet/connect 200            ← User connected wallet ✅
POST /api/deploy 200                    ← User deployed contract ✅
GET /api/staking/validators 503         ← RPC issue (will retry)
```

## That's It!
Your app is live and users can start building on Casper testnet.
