import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BridgeTransaction } from "@shared/schema";

const CHAINS = {
  casper: { name: "Casper Testnet", symbol: "CSPR", color: "text-red-500" },
  sepolia: { name: "Sepolia", symbol: "ETH", color: "text-blue-500" },
};

function BridgeFlowVisualization({
  sourceChain,
  destChain,
  amount,
  status,
}: {
  sourceChain: string;
  destChain: string;
  amount: number;
  status: BridgeTransaction["status"];
}) {
  const getStepStatus = (step: number) => {
    const statusMap = {
      initiated: 1,
      locked: 2,
      minting: 3,
      completed: 4,
      failed: 0,
    };
    const currentStep = statusMap[status];
    if (status === "failed") return "failed";
    if (step < currentStep) return "completed";
    if (step === currentStep) return "active";
    return "pending";
  };

  const steps = [
    { label: "Initiate", icon: Wallet },
    { label: "Lock", icon: Clock },
    { label: "Mint", icon: RefreshCcw },
    { label: "Complete", icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
            <span className="text-lg font-bold">
              {sourceChain === "casper" ? "C" : "E"}
            </span>
          </div>
          <p className="text-sm font-medium">
            {CHAINS[sourceChain as keyof typeof CHAINS]?.name}
          </p>
          <p className="text-xs text-muted-foreground">Source</p>
        </div>

        <div className="flex-1 mx-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-muted-foreground/30" />
            </div>
            <div className="relative flex justify-center">
              <div className="bg-card px-4 py-2 rounded-full border">
                <span className="text-lg font-bold">{amount}</span>
                <span className="text-sm text-muted-foreground ml-1">
                  {CHAINS[sourceChain as keyof typeof CHAINS]?.symbol}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
            <span className="text-lg font-bold">
              {destChain === "casper" ? "C" : "E"}
            </span>
          </div>
          <p className="text-sm font-medium">
            {CHAINS[destChain as keyof typeof CHAINS]?.name}
          </p>
          <p className="text-xs text-muted-foreground">Destination</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(index + 1);
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    stepStatus === "completed"
                      ? "bg-green-500 border-green-500 text-white"
                      : stepStatus === "active"
                        ? "bg-primary border-primary text-primary-foreground animate-pulse"
                        : stepStatus === "failed"
                          ? "bg-red-500 border-red-500 text-white"
                          : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs mt-1 text-muted-foreground">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 mx-2 mt-[-16px] ${
                    getStepStatus(index + 2) !== "pending"
                      ? "bg-green-500"
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TransactionCard({ tx }: { tx: BridgeTransaction }) {
  const getStatusBadge = (status: BridgeTransaction["status"]) => {
    const config = {
      initiated: { color: "bg-blue-500", label: "Initiated" },
      locked: { color: "bg-yellow-500", label: "Locked" },
      minting: { color: "bg-purple-500", label: "Minting" },
      completed: { color: "bg-green-500", label: "Completed" },
      failed: { color: "bg-red-500", label: "Failed" },
    };
    return (
      <Badge className={`${config[status].color} text-white`}>
        {config[status].label}
      </Badge>
    );
  };

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
      data-testid={`bridge-tx-${tx.id}`}
    >
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
        <ArrowLeftRight className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {tx.amount} {tx.token}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {CHAINS[tx.destinationChain as keyof typeof CHAINS]?.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {new Date(tx.timestamp).toLocaleString()}
        </p>
      </div>
      {getStatusBadge(tx.status)}
    </div>
  );
}

export default function Bridge() {
  const { toast } = useToast();
  const [sourceChain, setSourceChain] = useState("casper");
  const [destChain, setDestChain] = useState("sepolia");
  const [amount, setAmount] = useState("");
  const [activeBridge, setActiveBridge] = useState<BridgeTransaction | null>(
    null
  );

  const { data: transactions, isLoading } = useQuery<BridgeTransaction[]>({
    queryKey: ["/api/bridge/transactions"],
  });

  const bridgeMutation = useMutation({
    mutationFn: async (data: {
      sourceChain: string;
      destinationChain: string;
      amount: number;
      token: string;
    }) => {
      const response = await apiRequest("POST", "/api/bridge", data);
      return (await response.json()) as BridgeTransaction;
    },
    onSuccess: (data) => {
      setActiveBridge(data);
      toast({
        title: "Bridge Initiated",
        description: `Bridging ${amount} ${CHAINS[sourceChain as keyof typeof CHAINS]?.symbol}`,
      });
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Bridge Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSwapChains = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
  };

  const handleBridge = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    bridgeMutation.mutate({
      sourceChain,
      destinationChain: destChain,
      amount: numAmount,
      token: CHAINS[sourceChain as keyof typeof CHAINS]?.symbol,
    });
  };

  const mockTransactions: BridgeTransaction[] = [
    {
      id: "1",
      sourceChain: "casper",
      destinationChain: "sepolia",
      sourceAddress: "casper1abc...",
      destinationAddress: "0x123...",
      amount: 100,
      token: "CSPR",
      status: "completed",
      txHashSource: "0xabc123...",
      txHashDestination: "0xdef456...",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: "2",
      sourceChain: "sepolia",
      destinationChain: "casper",
      sourceAddress: "0x456...",
      destinationAddress: "casper1def...",
      amount: 0.5,
      token: "ETH",
      status: "minting",
      txHashSource: "0xghi789...",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const displayTransactions = transactions || mockTransactions;

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="bridge-page">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Cross-Chain Bridge
        </h1>
        <p className="text-muted-foreground">
          Bridge tokens between Casper and EVM-compatible networks
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Bridge Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>From</Label>
                <Select value={sourceChain} onValueChange={setSourceChain}>
                  <SelectTrigger data-testid="select-source-chain">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casper">Casper Testnet</SelectItem>
                    <SelectItem value="sepolia">Sepolia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwapChains}
                data-testid="button-swap-chains"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>

              <div className="flex-1 space-y-2">
                <Label>To</Label>
                <Select value={destChain} onValueChange={setDestChain}>
                  <SelectTrigger data-testid="select-dest-chain">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casper">Casper Testnet</SelectItem>
                    <SelectItem value="sepolia">Sepolia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bridge-amount">Amount</Label>
              <div className="relative">
                <Input
                  id="bridge-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16"
                  data-testid="input-bridge-amount"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {CHAINS[sourceChain as keyof typeof CHAINS]?.symbol}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Available: 10,000{" "}
                {CHAINS[sourceChain as keyof typeof CHAINS]?.symbol}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bridge Fee</span>
                <span>0.1%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Time</span>
                <span>~5 minutes</span>
              </div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span>You will receive</span>
                <span>
                  {amount
                    ? (parseFloat(amount) * 0.999).toFixed(4)
                    : "0.0000"}{" "}
                  {CHAINS[destChain as keyof typeof CHAINS]?.symbol}
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleBridge}
              disabled={bridgeMutation.isPending || !amount}
              data-testid="button-bridge"
            >
              {bridgeMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowLeftRight className="h-4 w-4 mr-2" />
              )}
              Bridge Tokens
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bridge Status</CardTitle>
          </CardHeader>
          <CardContent>
            {activeBridge ? (
              <BridgeFlowVisualization
                sourceChain={activeBridge.sourceChain}
                destChain={activeBridge.destinationChain}
                amount={activeBridge.amount}
                status={activeBridge.status}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">No Active Bridge</p>
                  <p className="text-sm text-muted-foreground">
                    Initiate a bridge transfer to see progress
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : displayTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No transactions yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayTransactions.map((tx) => (
                <TransactionCard key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
