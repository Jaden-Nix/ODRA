# ODRA-EVM Universal Contract Engine

**Production-ready blockchain platform for Casper Testnet development**

Deploy Solidity contracts to Casper, stake CSPR, bridge to Ethereum, and get AI-powered guidance.

## Features

### ✅ Core Blockchain
- **Compile** Solidity → WebAssembly for Casper
- **Deploy** contracts to Casper testnet (live on-chain)
- **Staking** CSPR with 20+ validators + real APY
- **Bridge** cCSPR to Ethereum Sepolia testnet
- **Real Data** only - no mocks, no simulations

### 🤖 AI Features
- **Security Analysis** - AI detects vulnerabilities in contracts
- **Yield Advisor** - AI recommends optimal staking strategies
- **Code Suggestions** - Gas optimization & best practices
- **Cross-Chain Helper** - Bridge fee analysis & risk assessment

### 🎯 Access Methods
- **Web UI** - Full-featured dashboard
- **CLI Tool** - One-command deployments
- **SDK/NPM** - Programmatic access
- **REST API** - 40+ endpoints

---

## Quick Start

### 1. Web Interface (Easiest)
```bash
# Already running on Replit
https://your-app-name.replit.dev

# Connect wallet → Deploy contracts → Stake CSPR
```

### 2. CLI Tool
```bash
npm install -g odra-evm

# Deploy contract
odra-evm deploy MyToken.sol --network testnet

# Stake CSPR
odra-evm stake 100 --validator <address>

# Bridge to Ethereum
odra-evm bridge 50 --to ethereum-sepolia
```

### 3. Run Locally
```bash
git clone <repo>
npm install
npm run dev

# Visit http://localhost:5000
```

---

## Example Contracts

### ERC-20 Token
```solidity
// Deploy via: odra-evm deploy ERC20.sol
contract MyToken {
  function transfer(address to, uint amount) public { }
  function approve(address spender, uint amount) public { }
}
```

### ERC-721 NFT
```solidity
// Deploy via: odra-evm deploy ERC721.sol
contract MyNFT {
  function mint(address to, string uri) public returns (uint) { }
  function transferFrom(address from, address to, uint id) public { }
}
```

### cCSPR Liquid Staking
```solidity
// Deploy via: odra-evm deploy LiquidStaking.sol
contract cCSPR {
  function stake() public payable { }  // Deposit CSPR
  function unstake(uint shares) public { }  // Withdraw + earn cCSPR
}
```

See `example-contracts/` directory.

---

## Deployment

### Publish on Replit (Production)
```
1. Click "Publish" button (top toolbar)
2. Choose "Autoscale"
3. Wait 2-3 minutes
4. Share generated URL with users
```

**Your app is now live!** Users can:
- Connect their Casper wallet
- Deploy contracts
- Stake CSPR
- Bridge tokens

### Debug Published App
```
Replit workspace → Publishing (left toolbar) → Logs
```

View real-time logs like:
```
[express] serving on port 5000          ✅
POST /api/wallet/connect 200            ✅ 
POST /api/deploy 200                    ✅
GET /api/staking/validators 200         ✅
```

---

## API Documentation

### Wallet
```bash
# Connect wallet
POST /api/wallet/connect
Body: { publicKey: "01abc..." }
Returns: { publicKey, balance, accountHash }

# Get balance
GET /api/wallet/balance?key=01abc...
Returns: { balance: 5000 }
```

### Deployment
```bash
# Compile contract
POST /api/contracts/compile
Body: { sourceCode: "contract..." }
Returns: { wasmBinary, gasEstimate }

# Deploy to testnet
POST /api/deploy
Body: { contractCode, contractName }
Returns: { deployHash, status, contractAddress }
```

### Staking
```bash
# Get validators
GET /api/staking/validators
Returns: [ { name, apy, commission, publicKey }, ... ]

# Create stake
POST /api/staking/stake
Body: { amount, validatorIndex, durationDays }
Returns: { id, amount, projectedYield, aiAdvice }
```

### AI
```bash
# Get AI security analysis
POST /api/ai/analyze-security
Body: { contractCode }
Returns: { vulnerabilities, riskScore, suggestions }

# Get AI yield advice
POST /api/ai/yield-advice
Body: { stakingAmount, durationDays, currentAPY }
Returns: { projectedYield, strategies, recommendation }
```

See all 40+ endpoints in `/api/routes.ts`.

---

## Database

### PostgreSQL/Neon
All data persists to PostgreSQL:
- `walletConnections` - Connected wallets + balances
- `deployments` - Contract deployments with status
- `stakingPositions` - User staking positions
- `bridgeTransactions` - Cross-chain transfers
- `activities` - Audit log of all actions

---

## Architecture

See `ARCHITECTURE.md` for:
- System diagram
- Service descriptions
- Data model
- Deployment flow
- Performance metrics

---

## Configuration

Environment variables (shared environment):
```bash
# Casper RPC
CASPER_RPC_URL=https://node.testnet.casper.network/rpc

# Ethereum RPC (for bridge)
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Database (auto-configured on Replit)
DATABASE_URL=postgresql://user:pass@host/db

# AI (optional)
OPENAI_API_KEY=sk-...
```

---

## Requirements

- **Minimum**: Public Casper key (66-char hex like `01abc...`)
- **For Staking**: 5+ CSPR on testnet (get from [faucet](https://testnet.cspr.live/tools/faucet))
- **For Bridge**: cCSPR tokens (earned from staking)
- **For CLI**: `npm install -g odra-evm`

---

## Demo

Run the full hackathon demo:
```bash
npm run dev                # Start app
npx ts-node scripts/demo.ts  # Run demo flow
```

Demo shows:
1. Wallet connection
2. Contract compilation
3. AI security analysis
4. Validator listing
5. Staking position creation
6. AI yield recommendations
7. Cross-chain bridge
8. Activity tracking

---

## Features Breakdown

| Feature | Web UI | CLI | SDK | Status |
|---------|--------|-----|-----|--------|
| Wallet Connect | ✅ | ✅ | ✅ | Live |
| Contract Compile | ✅ | ✅ | ✅ | Live |
| Deploy to Testnet | ✅ | ✅ | ✅ | Live |
| AI Security Analysis | ✅ | ✅ | ✅ | Live |
| Get Validators | ✅ | ✅ | ✅ | Live |
| Stake CSPR | ✅ | ✅ | ✅ | Live |
| AI Yield Advisor | ✅ | ✅ | ✅ | Live |
| Bridge Transfer | ✅ | ✅ | ✅ | Live |
| Activity Log | ✅ | - | ✅ | Live |

---

## Troubleshooting

### Wallet Won't Connect
- **Issue**: Invalid public key format
- **Fix**: Key must be 66 chars, start with `01` or `02`, be hexadecimal
- **Example**: `01abc123def456...` (66 chars total)

### No Validators Show
- **Issue**: RPC temporary unavailable
- **Fix**: App retries automatically. Wait 30 seconds.
- **Debug**: Check `Publishing` → `Logs` for RPC errors

### Deployment Pending Forever
- **Issue**: Testnet slow or contract error
- **Fix**: Check logs for error details

### Bridge Transfer Failed
- **Issue**: Insufficient destination liquidity
- **Fix**: Use smaller amount or different destination

---

## Next Steps

### For Developers
1. Deploy example contracts (`example-contracts/`)
2. Integrate with your dApp
3. Monitor via dashboard
4. Query API endpoints

### For Teams
1. Fork repository
2. Customize branding
3. Deploy on your infrastructure
4. Distribute to your community

### For Hackathons
1. Use demo script (`scripts/demo.ts`)
2. Deploy via Replit Publish
3. Submit your URL
4. Judges can test live on testnet

---

## Support

- **Docs**: See `DEPLOYMENT_GUIDE.md`, `ARCHITECTURE.md`, `replit.md`
- **Examples**: Check `example-contracts/` and `scripts/demo.ts`
- **API**: Explore endpoints at `/api/*` routes
- **Issues**: Check logs in `Publishing` tool

---

## License

MIT

---

## Made with Replit

Deploy to production in minutes. No infrastructure needed.

[Publish your app](https://docs.replit.com/hosting/publishing-overview)
