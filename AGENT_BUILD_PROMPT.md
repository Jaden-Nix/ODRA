# ODRA-EVM Universal Contract Engine - Complete Build Prompt

**For: Autonomous Agent Building System**

---

## EXECUTIVE SUMMARY

You are building a production-ready blockchain platform for Casper Testnet. The app currently has 60% of features working. Your job: Complete the remaining 40%, fix all fake/mock data, and deliver a hackathon-winning platform.

**Success Criteria:**
- ✅ No fake WASM - real WebAssembly compilation
- ✅ No mock UI data - real API calls or error states
- ✅ AI autopilot works - describe contract → AI generates → deploy
- ✅ AI code review works - suggest improvements → auto-patch → redeploy
- ✅ Cross-chain bridge works - real wrapped tokens on Ethereum
- ✅ All 40+ API endpoints working with real data
- ✅ UI shows real data or proper error states
- ✅ No console errors, no broken features

---

## CODEBASE OVERVIEW

**Current Stack:**
- Frontend: React + Vite + TailwindCSS + shadcn components
- Backend: Express.js + TypeScript
- Database: PostgreSQL (Neon on Replit)
- Blockchain: Casper Testnet RPC + Ethereum Sepolia
- AI: OpenAI GPT-4 (optional, has fallbacks)
- Compilation: Solidity via solc + WASM conversion

**Key Services:**
- `server/services/wallet.ts` - Wallet connection & balance queries
- `server/services/deployment.ts` - Contract deployment & polling
- `server/services/staking.ts` - Validator data & staking positions
- `server/services/bridge.ts` - Cross-chain transfers (STUB - needs work)
- `server/services/ai.ts` - AI analysis & recommendations
- `server/services/casper.ts` - Casper RPC calls

**Frontend:**
- `/client/src/pages/` - Dashboard, Editor, Staking, Bridge, etc.
- `/client/src/components/` - UI components + AI analysis panel
- `/client/src/lib/queryClient.ts` - TanStack Query setup

**Database:**
- `/shared/db-schema.ts` - Drizzle ORM schema
- Tables: deployments, stakingPositions, bridgeTransactions, walletConnections, etc.

---

## PART 1: CRITICAL FIXES (Do These First)

### FIX 1: Real WASM Compilation (CRITICAL)

**Problem:** `server/routes.ts` lines 266-276 generate fake WASM by wrapping bytecode in a fake header.

```typescript
// CURRENT (BROKEN):
const wasmHeader = "0061736d01000000";
const wasmCode = wasmHeader + Buffer.from(JSON.stringify({...})).toString('hex');
```

**Fix Required:**
1. Install real WASM compiler: `npm install solang` (or use ODRA)
2. Replace fake WASM generator with real compilation
3. Update `/api/compile` endpoint to return actual WebAssembly binary

**Implementation:**
```typescript
// Option A: Using solang (RECOMMENDED)
import { solang } from 'solang';

async function compileSolidityToWasm(sourceCode: string): Promise<Buffer> {
  try {
    const result = await solang.compile(sourceCode, {
      target: "wasm",
      optimize: true,
      version: "0.8.24"
    });
    
    if (!result.success) {
      throw new Error(`Compilation failed: ${result.errors.join(', ')}`);
    }
    
    return Buffer.from(result.wasm, 'hex');
  } catch (error) {
    throw new Error(`WASM compilation failed: ${error}`);
  }
}

// Update POST /api/compile endpoint:
// Instead of: const wasmCode = wasmHeader + ...
// Do:        const wasmBinary = await compileSolidityToWasm(code);
```

**Testing:**
- Compile simple ERC-20 contract
- Verify binary starts with correct WASM magic bytes: `0061736d`
- Deploy to Casper testnet and verify on explorer

**Impact:** Judges will test deployment - MUST work with real WASM

---

### FIX 2: Remove All Mock UI Data (HIGH)

**Problem:** Frontend pages have mock data fallbacks that show placeholder data instead of real data or errors.

**Affected Files:**
- `client/src/pages/staking.tsx` - Remove mockPositions
- `client/src/pages/bridge.tsx` - Remove mockTransactions  
- `client/src/pages/metrics.tsx` - Remove mockDeployments
- `client/src/pages/security.tsx` - Remove mockRecentAudits

**Pattern to Remove:**
```typescript
// DELETE THIS ENTIRE BLOCK:
const mockPositions: StakingPosition[] = [
  { id: "1", amount: 5000, ... },
  { id: "2", amount: 10000, ... },
];

// DELETE THIS LINE:
const displayPositions = positions || mockPositions;

// REPLACE WITH THIS:
const displayPositions = positions; // Just use real data
```

**What to Show Instead:**
- If loading: Show skeleton loaders (use shadcn Skeleton component)
- If error: Show error message with "Retry" button
- If no data: Show empty state with helpful message

**Example Error State:**
```typescript
if (isError) {
  return (
    <div className="p-6 text-center">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
      <p className="text-red-600">Failed to load staking positions</p>
      <button onClick={() => refetch()} className="mt-2 underline">
        Try again
      </button>
    </div>
  );
}

if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}

if (!positions || positions.length === 0) {
  return (
    <div className="p-6 text-center text-gray-500">
      No staking positions yet. Create one to get started.
    </div>
  );
}
```

**Verification:**
- Disable API endpoints and verify pages show error states
- Enable API and verify real data displays

---

### FIX 3: RPC Error Handling (HIGH)

**Problem:** When Casper RPC is unreachable, `server/services/casper.ts` returns fake zero values instead of errors.

**File:** `server/services/casper.ts`

**Issues:**
- getNetworkStatus() returns `blockHeight: 0, era: 0` when RPC fails
- getAccountBalance() returns `balance: 0` when RPC fails
- isOnline flag is always true, even when RPC down

**Fix:**

```typescript
// BEFORE (WRONG):
async getNetworkStatus(): Promise<NetworkStatus> {
  try {
    // RPC call
  } catch (error) {
    return {
      blockHeight: 0,  // <- Fake zero!
      era: 0,          // <- Fake zero!
      isOnline: true,  // <- Contradiction!
    };
  }
}

// AFTER (CORRECT):
async getNetworkStatus(): Promise<NetworkStatus> {
  try {
    // RPC call
    if (!data.result) {
      throw new Error("No block data from RPC");
    }
    return {
      blockHeight: header?.height || 0,
      era: header?.era_id || 0,
      isOnline: true,  // Only set true if we got real data
      // ...
    };
  } catch (error) {
    console.error("Network status error:", error);
    // Throw error instead of returning fake data
    throw new Error(`Failed to get network status: ${error.message}`);
  }
}

// For getAccountBalance():
async getAccountBalance(publicKeyHex: string): Promise<WalletInfo> {
  try {
    // RPC call
    if (!balanceResult) {
      throw new Error("Failed to fetch account balance from RPC");
    }
    return {
      publicKey: publicKeyHex,
      balance: balanceResult.balance_value,
      balanceInCSPR: parseInt(balanceResult.balance_value) / 1_000_000_000,
      accountHash: this.publicKeyToAccountHash(publicKeyHex),
    };
  } catch (error) {
    console.error("Balance fetch error:", error);
    throw error;  // Propagate error, don't return fake 0
  }
}
```

**Update API Error Handling:**

In `server/routes.ts`, wrap RPC calls with try-catch that returns proper HTTP errors:

```typescript
app.get("/api/network/status", async (req, res) => {
  try {
    const status = await casperService.getNetworkStatus();
    res.json(status);
  } catch (error) {
    res.status(503).json({
      error: "Casper RPC unavailable",
      message: error.message
    });
  }
});

app.post("/api/wallet/balance", async (req, res) => {
  try {
    const info = await casperService.getAccountBalance(publicKey);
    res.json(info);
  } catch (error) {
    res.status(503).json({
      error: "Failed to fetch balance",
      message: error.message
    });
  }
});
```

**Frontend Handling:**

When API returns 503, show offline indicator:

```typescript
if (error?.response?.status === 503) {
  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
      <AlertCircle className="inline mr-2" />
      Casper testnet is currently unreachable. Some features may be limited.
    </div>
  );
}
```

---

## PART 2: FEATURE COMPLETION

### FEATURE 1: Real WASM - AI Autopilot Mode

**Description:** Users describe what they want in natural language. AI generates Solidity → Compiles to WASM → Deploys to Casper.

**Implementation:**

1. **Add `/api/ai/generate-contract` Endpoint**

```typescript
// server/routes.ts
app.post("/api/ai/generate-contract", async (req, res) => {
  try {
    const { description, contractType } = req.body;
    
    // Validate
    if (!description) {
      return res.status(400).json({ error: "Description required" });
    }

    // Generate Solidity via AI
    const solidity = await aiService.generateContractFromDescription(
      description,
      contractType
    );

    // Compile to WASM
    const wasmBinary = await compileSolidityToWasm(solidity);

    // Analyze security
    const security = await aiService.analyzeContractSecurity(solidity);

    res.json({
      solidity,
      wasmBinary: wasmBinary.toString('hex'),
      wasmSize: wasmBinary.length,
      security,
      suggestion: `Generated ${contractType || 'contract'} contract. Security risk: ${security.riskScore}/100`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

2. **Add AI Generation Method to `server/services/ai.ts`**

```typescript
async generateContractFromDescription(
  description: string,
  contractType?: string
): Promise<string> {
  if (!this.isConfigured) {
    throw new Error("AI features require OpenAI API key");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert Solidity developer. Generate production-quality Solidity code based on user description.
          
Requirements:
- Use Solidity ^0.8.0
- Include proper error handling
- Add event emissions for important state changes
- Include NatSpec comments
- Follow best practices and gas optimization
- Return ONLY valid, compilable Solidity code with no markdown or explanation

${contractType ? `Contract type: ${contractType}` : ''}`
        },
        {
          role: "user",
          content: description
        }
      ],
      max_tokens: 4096,
    });

    const solidity = response.choices[0].message.content;
    
    // Validate it's actual Solidity
    if (!solidity.includes("pragma solidity") || !solidity.includes("contract")) {
      throw new Error("Generated output is not valid Solidity");
    }

    return solidity;
  } catch (error) {
    throw new Error(`Contract generation failed: ${error.message}`);
  }
}
```

3. **Create Autopilot UI Modal** in `client/src/components/autopilot-modal.tsx`

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function AutopilotModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      });
      const data = await response.json();
      setGenerated(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = () => {
    // Deploy the generated contract
    window.location.href = `/editor?code=${encodeURIComponent(generated.solidity)}`;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Autopilot - Generate Contract</DialogTitle>
        </DialogHeader>
        
        {!generated ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Describe your contract: 'Create a bonding curve token with 8 decimal places'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24"
              data-testid="input-contract-description"
            />
            <Button
              onClick={handleGenerate}
              disabled={!description || loading}
              data-testid="button-generate-contract"
            >
              {loading ? "Generating..." : "Generate Contract"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-green-800 text-sm">✅ Contract generated successfully</p>
              <p className="text-xs text-green-600 mt-1">Risk Score: {generated.security.riskScore}/100</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-32 overflow-auto">
              <code className="text-xs">{generated.solidity.slice(0, 200)}...</code>
            </div>
            <Button
              onClick={handleDeploy}
              data-testid="button-deploy-generated"
            >
              Deploy This Contract
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

4. **Add Autopilot Button to Editor**

```typescript
// client/src/pages/editor.tsx
import { AutopilotModal } from "@/components/autopilot-modal";

export default function EditorPage() {
  const [autopilotOpen, setAutopilotOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Contract Editor</h1>
        <Button
          onClick={() => setAutopilotOpen(true)}
          variant="outline"
          data-testid="button-autopilot"
        >
          🤖 AI Autopilot
        </Button>
      </div>
      
      {/* Editor UI */}
      <CodeEditor />
      
      <AutopilotModal
        open={autopilotOpen}
        onClose={() => setAutopilotOpen(false)}
      />
    </div>
  );
}
```

---

### FEATURE 2: AI Code Review with Auto-Patch

**Description:** AI analyzes contract for security & gas issues. User clicks "Apply Patch" → Code updates & redeploys automatically.

**Implementation:**

1. **Add `/api/ai/apply-suggestions` Endpoint**

```typescript
app.post("/api/ai/apply-suggestions", async (req, res) => {
  try {
    const { originalCode, suggestionIds } = req.body;

    // Get all suggestions
    const suggestions = await aiService.suggestCodeImprovements(originalCode);

    // Filter to selected suggestions
    const selected = suggestions.filter(s => suggestionIds.includes(s.id));

    // Apply each suggestion
    let patchedCode = originalCode;
    for (const suggestion of selected) {
      patchedCode = patchedCode.replace(suggestion.original, suggestion.suggested);
    }

    // Validate patched code compiles
    try {
      await compileSolidityToWasm(patchedCode);
    } catch (error) {
      return res.status(400).json({ error: "Patched code doesn't compile" });
    }

    // Get new security analysis
    const security = await aiService.analyzeContractSecurity(patchedCode);

    res.json({
      patchedCode,
      security,
      comparison: {
        before: { riskScore: security.riskScore }, // Real before value from original
        after: { riskScore: security.riskScore }
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

2. **Add Suggestions Panel to Editor**

```typescript
// client/src/components/code-suggestions-panel.tsx
export function CodeSuggestionsPanel({
  suggestions,
  onApply
}: {
  suggestions: CodeSuggestion[];
  onApply: (ids: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      await onApply(Array.from(selected));
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-blue-50">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        AI Suggestions
      </h3>
      
      {suggestions.length === 0 ? (
        <p className="text-sm text-gray-600">No suggestions at this time.</p>
      ) : (
        <div className="space-y-3">
          {suggestions.map(s => (
            <label key={s.id} className="flex items-start gap-3 p-2 hover:bg-white rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                onChange={(e) => {
                  const newSet = new Set(selected);
                  if (e.target.checked) {
                    newSet.add(s.id);
                  } else {
                    newSet.delete(s.id);
                  }
                  setSelected(newSet);
                }}
                className="mt-1"
                data-testid={`checkbox-suggestion-${s.id}`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{s.type}: {s.explanation}</p>
                <code className="text-xs text-gray-600 block mt-1 bg-white p-1 rounded">
                  {s.original.slice(0, 50)}... → {s.suggested.slice(0, 50)}...
                </code>
              </div>
            </label>
          ))}

          <Button
            onClick={handleApply}
            disabled={selected.size === 0 || loading}
            data-testid="button-apply-patches"
          >
            {loading ? "Applying..." : `Apply ${selected.size} Suggestions`}
          </Button>
        </div>
      )}
    </div>
  );
}
```

3. **Update Editor to Show Suggestions**

```typescript
// client/src/pages/editor.tsx
const [code, setCode] = useState("");
const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);

const handleAnalyze = async () => {
  const response = await fetch("/api/ai/code-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractCode: code })
  });
  const data = await response.json();
  setSuggestions(data);
};

const handleApplySuggestions = async (ids: string[]) => {
  const response = await fetch("/api/ai/apply-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originalCode: code,
      suggestionIds: ids
    })
  });
  const data = await response.json();
  setCode(data.patchedCode);
  toast.success("Code patched! Ready to deploy.");
};

return (
  <div className="grid grid-cols-3 gap-4">
    <div className="col-span-2">
      <CodeEditor value={code} onChange={setCode} />
      <Button onClick={handleAnalyze} mt={2}>Analyze</Button>
    </div>
    <CodeSuggestionsPanel
      suggestions={suggestions}
      onApply={handleApplySuggestions}
    />
  </div>
);
```

---

### FEATURE 3: Cross-Chain Wrapped Token (w-cCSPR)

**Description:** Deploy ERC-20 wrapper contract on Ethereum Sepolia. Bridge relays cCSPR from Casper → mint w-cCSPR on Ethereum.

**Implementation:**

1. **Create Wrapped Token Contract** (`example-contracts/wrappedCCSPR.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Wrapped cCSPR (w-cCSPR)
 * @dev ERC-20 wrapper for cCSPR bridged from Casper testnet
 */
contract WrappedCCSPR {
    string public name = "Wrapped cCSPR";
    string public symbol = "w-cCSPR";
    uint8 public decimals = 9;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public bridgeRelay;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    constructor() {
        bridgeRelay = msg.sender;
    }

    modifier onlyBridge() {
        require(msg.sender == bridgeRelay, "Only bridge can mint/burn");
        _;
    }

    function mint(address to, uint256 amount) external onlyBridge {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Minted(to, amount);
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyBridge {
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Burned(from, amount);
        emit Transfer(from, address(0), amount);
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
```

2. **Deploy Wrapped Token to Ethereum Sepolia**

Add to `server/services/bridge.ts`:

```typescript
import { ethers } from "ethers";

class BridgeService {
  private ethProvider: ethers.JsonRpcProvider;
  private wrappedTokenAddress = process.env.WRAPPED_CCSPR_ADDRESS; // Set after deployment

  constructor() {
    this.ethProvider = new ethers.JsonRpcProvider(
      "https://sepolia.infura.io/v3/" + process.env.INFURA_KEY
    );
  }

  async deployWrappedToken(): Promise<string> {
    // Deploy w-cCSPR contract to Sepolia (do this once, manually or via script)
    // Return deployed contract address
    console.log("w-cCSPR deployed at:", this.wrappedTokenAddress);
    return this.wrappedTokenAddress!;
  }

  async mintWrappedToken(
    recipientAddress: string,
    amount: number
  ): Promise<string> {
    // This is called by relay when bridge transfer succeeds
    if (!this.wrappedTokenAddress) {
      throw new Error("Wrapped token not deployed");
    }

    const contract = new ethers.Contract(
      this.wrappedTokenAddress,
      [
        "function mint(address to, uint256 amount) external",
      ],
      this.ethProvider
    );

    // Sign transaction with bridge operator key
    const signer = new ethers.Wallet(
      process.env.BRIDGE_OPERATOR_KEY!,
      this.ethProvider
    );
    const tx = await contract.connect(signer).mint(recipientAddress, amount);
    return tx.hash;
  }
}
```

3. **Update `/api/bridge/transfer` to Create w-cCSPR**

```typescript
app.post("/api/bridge/transfer", async (req, res) => {
  try {
    const { amount, recipientAddress, sourceChain } = req.body;

    if (sourceChain !== "casper-testnet" || !recipientAddress.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid bridge parameters" });
    }

    // Create bridge transaction record
    const transfer = await dbStorage.createBridgeTransaction({
      sourceChain: "casper-testnet",
      destChain: "ethereum-sepolia",
      amount,
      status: "pending",
      recipientAddress,
    });

    // Initiate Casper side (burn cCSPR)
    // ... burn logic here

    // Mint w-cCSPR on Ethereum Sepolia
    try {
      const ethTxHash = await bridgeService.mintWrappedToken(
        recipientAddress,
        amount * 1e9 // Convert to wei
      );

      await dbStorage.updateBridgeTransaction(transfer.id, {
        status: "confirmed",
        ethTxHash,
      });

      res.json({
        casperTxHash: transfer.id,
        ethTxHash,
        amount,
        status: "confirmed"
      });
    } catch (error) {
      await dbStorage.updateBridgeTransaction(transfer.id, {
        status: "failed",
        errorMessage: error.message,
      });
      throw error;
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

## PART 3: FEATURE ADDITIONS (From Roadmap)

### Quick Wins (30 mins each, HIGH IMPACT)

1. **Validator Search Filter**
   - Add input field to filter validators by name
   - File: `client/src/pages/staking.tsx`

2. **Copy Address Button**
   - Add copy-to-clipboard on all contract addresses
   - Use: `navigator.clipboard.writeText(address)`

3. **Validator Favorites**
   - Star icon to save favorite validators
   - Store in localStorage
   - Show "Recent" at top

4. **Portfolio Dashboard**
   - Sum all assets (CSPR + cCSPR + bridged)
   - Show pie chart of allocation
   - File: `client/src/pages/dashboard.tsx`

5. **Earnings Calculator**
   - Input: amount + days + APY
   - Output: projected yield in real-time
   - File: Add to staking page

### Medium Priority Features (If time allows)

6. **Contract Templates Marketplace**
   - API: `GET /api/templates` - list all templates
   - UI: Dropdown on editor showing templates
   - One-click load into editor

7. **Validator Comparison Tool**
   - Side-by-side view of 2 validators
   - Highlight better APY, uptime, etc.

8. **Yield Charts**
   - Historical APY trends (line chart)
   - Top validators (bar chart)
   - Use Recharts (already installed)

---

## PART 4: TESTING & VALIDATION

### Test Every Feature

1. **WASM Compilation**
   ```bash
   # Deploy ERC20.sol via API
   curl -X POST http://localhost:5000/api/compile \
     -H "Content-Type: application/json" \
     -d '{"code": "pragma solidity ^0.8.0; contract T {...}", "contractName": "Test"}'
   # Verify wasmCode starts with 0061736d (WASM magic bytes)
   ```

2. **Autopilot Mode**
   - Go to editor
   - Click "AI Autopilot"
   - Enter: "Create me an ERC-20 token with 18 decimals"
   - Verify contract generates and deploys

3. **AI Code Review**
   - Paste vulnerable code
   - Click "Analyze"
   - Verify suggestions appear
   - Click "Apply Patches"
   - Verify code updates

4. **Bridge Transfer**
   - Stake CSPR → get cCSPR
   - Go to bridge
   - Enter amount
   - Click "Bridge to Sepolia"
   - Verify w-cCSPR appears on Ethereum (check Etherscan Sepolia)

5. **Error States**
   - Disconnect from RPC
   - Verify error messages (not 0 values)
   - Reconnect and verify recovery

### Checklist Before Submission

- [ ] No fake WASM - real compilation
- [ ] No mock UI data - all real or error states
- [ ] Autopilot works end-to-end
- [ ] AI code review + patch works
- [ ] Cross-chain bridge works with real w-cCSPR
- [ ] No console errors
- [ ] No broken API endpoints
- [ ] All 40+ endpoints documented
- [ ] Database migrations work
- [ ] Can restart and recover state
- [ ] App runs on port 5000
- [ ] Published URL works

---

## PART 5: DEPLOYMENT

### Before Publishing

1. **Run Tests**
   ```bash
   npm run check  # TypeScript type check
   ```

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Test Locally**
   ```bash
   npm run dev
   # Visit http://localhost:5000
   # Test all features
   ```

### Publish to Replit

1. Click "Publish" (top toolbar)
2. Choose "Autoscale"
3. Deploy
4. Get live URL
5. Monitor via Publishing → Logs tab

### Share with Judges

- Live URL where they can test
- GitHub link to code
- Demo video (3-5 min showing all features)

---

## PART 6: FILES TO CREATE/MODIFY

### Create These Files

- `cli/index.ts` - Already exists, ensure working
- `example-contracts/wrappedCCSPR.sol` - New
- `scripts/demo.ts` - Already exists, ensure working
- `client/src/components/autopilot-modal.tsx` - New
- `client/src/components/code-suggestions-panel.tsx` - New

### Modify These Files

**Backend:**
- `server/routes.ts` - Real WASM compilation, AI endpoints, bridge
- `server/services/ai.ts` - Add generateContractFromDescription
- `server/services/bridge.ts` - Real bridge logic
- `server/services/casper.ts` - Fix RPC error handling
- `server/services/deployment.ts` - Ensure works with real WASM

**Frontend:**
- `client/src/pages/staking.tsx` - Remove mock data, add search
- `client/src/pages/bridge.tsx` - Remove mock data, add real transfers
- `client/src/pages/metrics.tsx` - Remove mock data
- `client/src/pages/security.tsx` - Remove mock data
- `client/src/pages/editor.tsx` - Add autopilot + code review
- `client/src/pages/dashboard.tsx` - Add portfolio view

---

## CRITICAL NOTES

1. **Fake WASM is the #1 priority** - Judges will test deployment first
2. **Remove ALL mock data before submission** - Shows confidence in real features
3. **Real data > Mock data** - Never show placeholder data
4. **Error handling > Silence** - Better to fail loudly than appear to work
5. **Test everything** - Each feature must work end-to-end
6. **No console errors** - Clean logs only
7. **Use env variables** - For API keys, RPC URLs, etc.

---

## SUCCESS CRITERIA

Your build is complete when:

✅ Real WASM compilation (not fake header)  
✅ No mock UI data (real or error states)  
✅ AI autopilot works (describe → generate → deploy)  
✅ AI code review works (suggest → patch → redeploy)  
✅ Cross-chain bridge works (Casper → Ethereum w-cCSPR)  
✅ All features tested and working  
✅ No console errors  
✅ Can publish and judges can access live URL  
✅ Judges can deploy a contract from Solidity code  
✅ Judges can stake CSPR with AI recommendations  
✅ Judges can bridge to Ethereum and see wrapped tokens  

---

## ESTIMATED EFFORT

| Task | Time | Priority |
|------|------|----------|
| Real WASM compilation | 2-3 hours | CRITICAL |
| Remove mock UI data | 30 mins | CRITICAL |
| RPC error handling | 1 hour | CRITICAL |
| AI Autopilot | 2 hours | HIGH |
| AI Code Review | 1.5 hours | HIGH |
| Bridge w-cCSPR | 2 hours | HIGH |
| Quick wins | 2-3 hours | MEDIUM |
| Testing & polish | 1 hour | MEDIUM |

**Total: ~12-15 hours of focused work**

---

**YOU'VE GOT THIS! Build it, test it, ship it. 🚀**
