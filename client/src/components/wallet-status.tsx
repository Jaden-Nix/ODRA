import { useState } from "react";
import { useWallet, validatePublicKey } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Wallet, Copy, ExternalLink, RefreshCw, LogOut, ChevronDown, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WalletStatus() {
  const {
    publicKey,
    accountHash,
    balanceCSPR,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    formatBalance,
    shortenAddress,
    isPending,
    isRefreshing,
  } = useWallet();

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = () => {
    const validation = validatePublicKey(inputKey);
    if (!validation.valid) {
      setInputError(validation.error || "Invalid public key");
      return;
    }

    setInputError(null);
    connectWallet(inputKey);
    setIsDialogOpen(false);
    setInputKey("");
  };

  const handleCopyAddress = async () => {
    if (accountHash) {
      await navigator.clipboard.writeText(accountHash);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewExplorer = () => {
    if (accountHash) {
      window.open(`https://testnet.cspr.live/account/${accountHash}`, "_blank");
    }
  };

  if (!isConnected) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" data-testid="button-connect-wallet">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Casper Wallet</DialogTitle>
            <DialogDescription>
              Enter your Casper testnet public key to connect. Get testnet CSPR from the faucet at testnet.cspr.live
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="public-key">
                Public Key
              </label>
              <Input
                id="public-key"
                placeholder="01a1b2c3d4e5f6..."
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setInputError(null);
                }}
                data-testid="input-public-key"
              />
              {inputError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {inputError}
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Public keys start with:</p>
              <ul className="list-disc list-inside mt-1">
                <li><code>01</code> for ED25519 keys</li>
                <li><code>02</code> for SECP256K1 keys</li>
              </ul>
            </div>
            <Button 
              onClick={handleConnect} 
              className="w-full"
              disabled={isPending || isConnecting || !inputKey}
              data-testid="button-submit-connect"
            >
              {isPending || isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-wallet-dropdown">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">{formatBalance()} CSPR</span>
          <Badge variant="secondary" className="hidden md:flex">
            {shortenAddress()}
          </Badge>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2">
          <p className="text-sm font-medium">Connected Wallet</p>
          <p className="text-xs text-muted-foreground truncate">{accountHash}</p>
        </div>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="text-lg font-semibold">{formatBalance()} CSPR</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopyAddress} data-testid="menu-copy-address">
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewExplorer} data-testid="menu-view-explorer">
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => refreshBalance()} 
          disabled={isRefreshing}
          data-testid="menu-refresh-balance"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Balance
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={disconnectWallet}
          className="text-destructive focus:text-destructive"
          data-testid="menu-disconnect"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
