import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Coins,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calculator,
  Loader2,
  Lock,
  Unlock,
  RefreshCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
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
import type { StakingPosition, YieldAdvice } from "@shared/schema";

function StakingPositionCard({ position }: { position: StakingPosition }) {
  const getStatusColor = (status: StakingPosition["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "unstaking":
        return "bg-yellow-500";
      case "completed":
        return "bg-muted";
    }
  };

  const startDate = new Date(position.startDate);
  const endDate = position.endDate ? new Date(position.endDate) : null;
  const now = new Date();
  const totalDuration = endDate
    ? endDate.getTime() - startDate.getTime()
    : 30 * 24 * 60 * 60 * 1000;
  const elapsed = now.getTime() - startDate.getTime();
  const progress = Math.min(100, (elapsed / totalDuration) * 100);

  return (
    <Card data-testid={`staking-position-${position.id}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-3xl font-bold">
              {position.amount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">{position.currency}</p>
          </div>
          <Badge className={`${getStatusColor(position.status)} text-white capitalize`}>
            {position.status === "active" && <Lock className="h-3 w-3 mr-1" />}
            {position.status === "unstaking" && (
              <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
            )}
            {position.status === "completed" && (
              <Unlock className="h-3 w-3 mr-1" />
            )}
            {position.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">APY</p>
            <p className="text-lg font-semibold text-green-500">
              {position.apy}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rewards</p>
            <p className="text-lg font-semibold">
              +{position.rewards.toFixed(4)} {position.currency}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Lock Progress</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {position.status === "active" && (
          <Button variant="secondary" className="w-full mt-4" size="sm">
            <Unlock className="h-4 w-4 mr-2" />
            Unstake
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Staking() {
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeDuration, setStakeDuration] = useState([30]);
  const [selectedValidator, setSelectedValidator] = useState("");

  const { data: positions, isLoading: positionsLoading } = useQuery<
    StakingPosition[]
  >({
    queryKey: ["/api/staking/positions"],
  });

  const yieldMutation = useMutation({
    mutationFn: async ({
      amount,
      duration,
    }: {
      amount: number;
      duration: number;
    }) => {
      const response = await apiRequest("POST", "/api/yield", {
        amount,
        duration,
      });
      return (await response.json()) as YieldAdvice;
    },
  });

  const stakeMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      duration: number;
      validator?: string;
    }) => {
      const response = await apiRequest("POST", "/api/stake", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Staking Initiated",
        description: `Successfully staked ${stakeAmount} CSPR`,
      });
      setStakeAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Staking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCalculateYield = () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid staking amount",
        variant: "destructive",
      });
      return;
    }
    yieldMutation.mutate({ amount, duration: stakeDuration[0] });
  };

  const handleStake = () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid staking amount",
        variant: "destructive",
      });
      return;
    }
    stakeMutation.mutate({
      amount,
      duration: stakeDuration[0],
      validator: selectedValidator || undefined,
    });
  };

  const displayPositions = positions || [];
  const totalStaked = displayPositions.reduce((sum, p) => sum + p.amount, 0);
  const totalRewards = displayPositions.reduce((sum, p) => sum + p.rewards, 0);
  const avgApy =
    displayPositions.reduce((sum, p) => sum + p.apy, 0) /
    displayPositions.length;

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="staking-page">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Staking</h1>
        <p className="text-muted-foreground">
          Stake your CSPR tokens and earn rewards on the Casper network
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Staked
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStaked.toLocaleString()} CSPR
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ~${(totalStaked * 0.035).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rewards
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              +{totalRewards.toFixed(2)} CSPR
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">
                Earning {avgApy.toFixed(1)}% APY
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Positions
            </CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayPositions.filter((p) => p.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {displayPositions.filter((p) => p.status === "completed").length}{" "}
              completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10,000 CSPR</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to stake</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Stake Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Stake Amount (CSPR)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  data-testid="input-stake-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Validator</Label>
                <Select
                  value={selectedValidator}
                  onValueChange={setSelectedValidator}
                >
                  <SelectTrigger data-testid="select-validator">
                    <SelectValue placeholder="Select validator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="validator-1">
                      Casper Validator 1 (8.5% APY)
                    </SelectItem>
                    <SelectItem value="validator-2">
                      Casper Validator 2 (8.2% APY)
                    </SelectItem>
                    <SelectItem value="validator-3">
                      Casper Validator 3 (7.9% APY)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Lock Duration</Label>
                <span className="text-sm font-medium">
                  {stakeDuration[0]} days
                </span>
              </div>
              <Slider
                value={stakeDuration}
                onValueChange={setStakeDuration}
                min={7}
                max={365}
                step={1}
                data-testid="slider-duration"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>7 days</span>
                <span>365 days</span>
              </div>
            </div>

            {yieldMutation.data && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Projected Yield
                  </span>
                  <span className="text-lg font-bold text-green-500">
                    +{yieldMutation.data.projectedYield.toFixed(2)} CSPR
                  </span>
                </div>
                {yieldMutation.data.strategies.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      AI Recommendations:
                    </p>
                    <ul className="text-xs space-y-1">
                      {yieldMutation.data.strategies.slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <TrendingUp className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleCalculateYield}
                disabled={yieldMutation.isPending || !stakeAmount}
                data-testid="button-calculate-yield"
              >
                {yieldMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4 mr-2" />
                )}
                Calculate Yield
              </Button>
              <Button
                onClick={handleStake}
                disabled={stakeMutation.isPending || !stakeAmount}
                data-testid="button-stake"
              >
                {stakeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Stake Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Your Positions</h2>
          {positionsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-8 w-32 mb-4" />
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {displayPositions.map((position) => (
                <StakingPositionCard key={position.id} position={position} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
