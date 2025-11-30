import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  RotateCcw,
  Download,
  FileCode,
} from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
}

const DEFAULT_CONTRACT = `// SPDX-License-Identifier: MIT
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
}`;

export function CodeEditor({
  value,
  onChange,
  language = "solidity",
  readOnly = false,
  height = "400px",
  placeholder,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

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
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Contract.sol</span>
          <Badge variant="secondary" className="text-xs">
            {language}
          </Badge>
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
