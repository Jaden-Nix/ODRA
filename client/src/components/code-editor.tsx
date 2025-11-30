import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Check,
  RotateCcw,
  Download,
  FileCode,
  FileText,
} from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
}

const TEMPLATES = {
  simple: {
    name: "Simple Token",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleToken
 * @dev A basic ERC20-like token contract
 */
contract SimpleToken {
    string public name = "Simple Token";
    string public symbol = "STK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** decimals;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid recipient");
        
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        emit Transfer(msg.sender, _to, _value);
        return true;
    }
    
    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Insufficient allowance");
        require(_to != address(0), "Invalid recipient");
        
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        
        emit Transfer(_from, _to, _value);
        return true;
    }
}`,
  },
  wrappedCSPR: {
    name: "Wrapped CSPR (Bridge)",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WrappedCSPR (wCSPR)
 * @dev Cross-chain wrapped CSPR token for Casper-EVM bridge
 * @notice This contract enables CSPR tokens to be used on EVM-compatible chains
 */
contract WrappedCSPR {
    string public constant name = "Wrapped Casper";
    string public constant symbol = "wCSPR";
    uint8 public constant decimals = 9;
    uint256 public totalSupply;
    
    address public bridge;
    address public owner;
    bool public paused;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(bytes32 => bool) public processedDeposits;
    mapping(bytes32 => bool) public processedWithdrawals;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount, bytes32 indexed casperTxHash);
    event Burn(address indexed from, uint256 amount, string casperAddress);
    event BridgeUpdated(address indexed oldBridge, address indexed newBridge);
    event Paused(address account);
    event Unpaused(address account);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyBridge() {
        require(msg.sender == bridge, "Not bridge");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    constructor(address _bridge) {
        owner = msg.sender;
        bridge = _bridge;
    }
    
    function mint(address to, uint256 amount, bytes32 casperTxHash) 
        external 
        onlyBridge 
        whenNotPaused 
        returns (bool) 
    {
        require(!processedDeposits[casperTxHash], "Deposit already processed");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        
        processedDeposits[casperTxHash] = true;
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
        emit Mint(to, amount, casperTxHash);
        return true;
    }
    
    function burn(uint256 amount, string calldata casperAddress) 
        external 
        whenNotPaused 
        returns (bytes32) 
    {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be positive");
        require(bytes(casperAddress).length > 0, "Invalid Casper address");
        
        bytes32 withdrawalId = keccak256(
            abi.encodePacked(msg.sender, amount, casperAddress, block.timestamp)
        );
        require(!processedWithdrawals[withdrawalId], "Withdrawal exists");
        
        processedWithdrawals[withdrawalId] = true;
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        
        emit Transfer(msg.sender, address(0), amount);
        emit Burn(msg.sender, amount, casperAddress);
        return withdrawalId;
    }
    
    function transfer(address to, uint256 amount) 
        external 
        whenNotPaused 
        returns (bool) 
    {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        require(to != address(0), "Invalid recipient");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) 
        external 
        whenNotPaused 
        returns (bool) 
    {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(to != address(0), "Invalid recipient");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function setBridge(address newBridge) external onlyOwner {
        require(newBridge != address(0), "Invalid bridge");
        emit BridgeUpdated(bridge, newBridge);
        bridge = newBridge;
    }
    
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
}`,
  },
  nft: {
    name: "NFT Collection",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NFTCollection
 * @dev A basic ERC721-like NFT contract
 */
contract NFTCollection {
    string public name = "My NFT Collection";
    string public symbol = "MNFT";
    
    uint256 private _tokenIdCounter;
    address public owner;
    
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(uint256 => string) private _tokenURIs;
    
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function balanceOf(address _owner) public view returns (uint256) {
        require(_owner != address(0), "Invalid address");
        return _balances[_owner];
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }
    
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }
    
    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        require(to != address(0), "Invalid recipient");
        
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        _balances[to]++;
        _owners[newTokenId] = to;
        _tokenURIs[newTokenId] = uri;
        
        emit Transfer(address(0), to, newTokenId);
        return newTokenId;
    }
    
    function approve(address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(msg.sender == tokenOwner, "Not token owner");
        require(to != tokenOwner, "Cannot approve self");
        
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }
    
    function transferFrom(address from, address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(tokenOwner == from, "Not owner");
        require(
            msg.sender == from || _tokenApprovals[tokenId] == msg.sender,
            "Not authorized"
        );
        require(to != address(0), "Invalid recipient");
        
        _tokenApprovals[tokenId] = address(0);
        _balances[from]--;
        _balances[to]++;
        _owners[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}`,
  },
  staking: {
    name: "Staking Pool",
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StakingPool
 * @dev A staking contract with rewards distribution
 */
contract StakingPool {
    address public owner;
    uint256 public rewardRate = 100;
    uint256 public totalStaked;
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }
    
    mapping(address => Stake) public stakes;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function stake() external payable {
        require(msg.value > 0, "Amount must be positive");
        
        if (stakes[msg.sender].amount > 0) {
            uint256 pending = pendingReward(msg.sender);
            stakes[msg.sender].rewardDebt += pending;
        }
        
        stakes[msg.sender].amount += msg.value;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value);
    }
    
    function unstake(uint256 amount) external {
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        
        uint256 reward = pendingReward(msg.sender) + stakes[msg.sender].rewardDebt;
        stakes[msg.sender].amount -= amount;
        stakes[msg.sender].rewardDebt = 0;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked -= amount;
        
        payable(msg.sender).transfer(amount);
        
        if (reward > 0 && address(this).balance >= reward) {
            payable(msg.sender).transfer(reward);
            emit RewardClaimed(msg.sender, reward);
        }
        
        emit Unstaked(msg.sender, amount);
    }
    
    function claimReward() external {
        uint256 reward = pendingReward(msg.sender) + stakes[msg.sender].rewardDebt;
        require(reward > 0, "No rewards");
        require(address(this).balance >= reward, "Insufficient balance");
        
        stakes[msg.sender].rewardDebt = 0;
        stakes[msg.sender].timestamp = block.timestamp;
        
        payable(msg.sender).transfer(reward);
        emit RewardClaimed(msg.sender, reward);
    }
    
    function pendingReward(address user) public view returns (uint256) {
        if (stakes[user].amount == 0) return 0;
        
        uint256 duration = block.timestamp - stakes[user].timestamp;
        return (stakes[user].amount * rewardRate * duration) / (365 days * 10000);
    }
    
    function getStake(address user) external view returns (
        uint256 amount,
        uint256 timestamp,
        uint256 pending
    ) {
        Stake memory s = stakes[user];
        return (s.amount, s.timestamp, pendingReward(user) + s.rewardDebt);
    }
    
    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
    }
    
    function fundRewards() external payable onlyOwner {}
    
    receive() external payable {}
}`,
  },
};

const DEFAULT_CONTRACT = TEMPLATES.simple.code;

export function CodeEditor({
  value,
  onChange,
  language = "solidity",
  readOnly = false,
  height = "400px",
  placeholder,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("simple");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
    if (template) {
      onChange(template.code);
    }
  };

  const lines = value.split("\n");
  const lineCount = lines.length;

  useEffect(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [value]);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    onChange(DEFAULT_CONTRACT);
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contract.sol";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 flex-wrap">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Contract.sol</span>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger className="w-[180px] h-7" data-testid="select-template">
              <FileText className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <SelectItem key={key} value={key} data-testid={`template-${key}`}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            data-testid="button-copy-code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            data-testid="button-reset-code"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            data-testid="button-download-code"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="relative flex" style={{ height }}>
        <div
          ref={lineNumbersRef}
          className="flex flex-col items-end py-3 px-3 bg-muted/20 text-muted-foreground text-sm font-mono select-none overflow-hidden border-r"
          style={{ minWidth: "48px" }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="leading-6 text-xs">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent p-3 text-sm font-mono leading-6 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{ tabSize: 2 }}
          data-testid="textarea-code-editor"
        />
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <span>
          {lineCount} lines | {value.length} characters
        </span>
        <span>Solidity ^0.8.20</span>
      </div>
    </div>
  );
}

export { DEFAULT_CONTRACT };
