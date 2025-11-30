import { useQuery } from "@tanstack/react-query";
import {
  Code2,
  Fuel,
  CheckCircle2,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { DashboardStats, ActivityItem } from "@shared/schema";

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendDirection,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: string;
  trendDirection?: "up" | "down";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <Badge
              variant="secondary"
              className={`text-xs ${
                trendDirection === "up"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {trendDirection === "up" ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "compile":
        return Code2;
      case "deploy":
        return Zap;
      case "analyze":
        return AlertTriangle;
      case "stake":
        return TrendingUp;
      case "bridge":
        return Activity;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: ActivityItem["status"]) => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
    }
  };

  const Icon = getActivityIcon(activity.type);
  const timeAgo = getTimeAgo(activity.timestamp);

  return (
    <div
      className="flex items-center gap-4 py-3 border-b border-border last:border-0"
      data-testid={`activity-item-${activity.id}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{activity.description}</p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      <Badge
        variant="secondary"
        className={`capitalize ${getStatusColor(activity.status)}`}
      >
        {activity.status}
      </Badge>
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NetworkStatusBadge({ status }: { status: string }) {
  const colors = {
    online: "bg-green-500",
    degraded: "bg-yellow-500",
    offline: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${colors[status as keyof typeof colors] || colors.offline}`}
      />
      <span className="text-sm capitalize">{status}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000,
  });

  const defaultStats: DashboardStats = {
    contractsDeployed: 12,
    totalGasUsed: 2450000,
    successRate: 98.5,
    networkStatus: "online",
    recentActivity: [
      {
        id: "1",
        type: "compile",
        description: "Compiled ERC20Token.sol",
        status: "success",
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: "2",
        type: "deploy",
        description: "Deployed NFTMarketplace to testnet",
        status: "success",
        timestamp: new Date(Date.now() - 900000).toISOString(),
      },
      {
        id: "3",
        type: "analyze",
        description: "Security audit for StakingPool.sol",
        status: "pending",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: "4",
        type: "stake",
        description: "Staked 500 CSPR",
        status: "success",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "5",
        type: "bridge",
        description: "Bridged 100 CSPR to Sepolia",
        status: "success",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  };

  const displayStats = stats || defaultStats;

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="dashboard-page">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your smart contract development activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Contracts Deployed"
              value={displayStats.contractsDeployed}
              description="Total deployments"
              icon={Code2}
              trend="+12%"
              trendDirection="up"
            />
            <StatsCard
              title="Total Gas Used"
              value={`${(displayStats.totalGasUsed / 1000000).toFixed(2)}M`}
              description="Across all deployments"
              icon={Fuel}
              trend="+8%"
              trendDirection="up"
            />
            <StatsCard
              title="Success Rate"
              value={`${displayStats.successRate}%`}
              description="Compilation success"
              icon={CheckCircle2}
              trend="+2.1%"
              trendDirection="up"
            />
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Network Status
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <NetworkStatusBadge status={displayStats.networkStatus} />
                <p className="text-xs text-muted-foreground mt-2">
                  Casper Testnet
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/metrics" data-testid="link-view-all-activity">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {displayStats.recentActivity.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button className="w-full justify-start gap-3" asChild>
              <Link href="/editor" data-testid="button-new-contract">
                <Code2 className="h-4 w-4" />
                New Contract
              </Link>
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              asChild
            >
              <Link href="/security" data-testid="button-security-audit">
                <AlertTriangle className="h-4 w-4" />
                Security Audit
              </Link>
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              asChild
            >
              <Link href="/staking" data-testid="button-stake-tokens">
                <TrendingUp className="h-4 w-4" />
                Stake Tokens
              </Link>
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-3"
              asChild
            >
              <Link href="/bridge" data-testid="button-bridge-assets">
                <ArrowUpRight className="h-4 w-4" />
                Bridge Assets
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Getting Started</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              New to ODRA-EVM? Follow these steps to deploy your first contract
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Write Contract</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your Solidity smart contract in the editor
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Compile to Wasm</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Convert Solidity to Casper-compatible Wasm
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Security Audit</p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI-powered vulnerability analysis
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                4
              </div>
              <div>
                <p className="font-medium text-sm">Deploy</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deploy to Casper testnet
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
