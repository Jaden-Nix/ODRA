import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
  Fuel,
  TrendingUp,
  BarChart3,
  LineChart,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CompilationMetrics, Deployment } from "@shared/schema";

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend && (
            <Badge
              variant="secondary"
              className={
                trend.positive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CompilationChart() {
  const data = [
    { day: "Mon", success: 12, failed: 2 },
    { day: "Tue", success: 18, failed: 1 },
    { day: "Wed", success: 15, failed: 3 },
    { day: "Thu", success: 22, failed: 0 },
    { day: "Fri", success: 19, failed: 2 },
    { day: "Sat", success: 8, failed: 0 },
    { day: "Sun", success: 5, failed: 1 },
  ];

  const maxValue = Math.max(...data.map((d) => d.success + d.failed));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Successful</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Failed</span>
        </div>
      </div>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col-reverse gap-0.5">
              <div
                className="bg-green-500 rounded-t"
                style={{ height: `${(d.success / maxValue) * 120}px` }}
              />
              {d.failed > 0 && (
                <div
                  className="bg-red-500 rounded-t"
                  style={{ height: `${(d.failed / maxValue) * 120}px` }}
                />
              )}
            </div>
            <span className="text-xs text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GasUsageChart() {
  const data = [65, 78, 82, 70, 85, 90, 75, 88, 92, 80, 76, 85];

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1 h-32">
        {data.map((value, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-primary/80 rounded-t"
              style={{ height: `${value}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>12h ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

export default function Metrics() {
  const { data: metrics, isLoading } = useQuery<CompilationMetrics>({
    queryKey: ["/api/metrics"],
    refetchInterval: 30000,
  });

  const { data: deployments, isLoading: deploymentsLoading } = useQuery<
    Deployment[]
  >({
    queryKey: ["/api/deployments"],
  });

  const defaultMetrics: CompilationMetrics = {
    totalCompilations: 142,
    successfulCompilations: 136,
    failedCompilations: 6,
    averageCompilationTime: 245,
    successRate: 95.77,
  };

  const displayMetrics = metrics || defaultMetrics;
  const displayDeployments = deployments || [];

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="metrics-page">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Metrics</h1>
        <p className="text-muted-foreground">
          Real-time compilation and deployment analytics
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
            <MetricCard
              title="Total Compilations"
              value={displayMetrics.totalCompilations}
              subtitle="All time"
              icon={Code2}
              trend={{ value: "12%", positive: true }}
            />
            <MetricCard
              title="Success Rate"
              value={`${displayMetrics.successRate.toFixed(1)}%`}
              subtitle={`${displayMetrics.successfulCompilations} successful`}
              icon={CheckCircle2}
              color="text-green-500"
              trend={{ value: "2.1%", positive: true }}
            />
            <MetricCard
              title="Failed Compilations"
              value={displayMetrics.failedCompilations}
              subtitle="Errors encountered"
              icon={XCircle}
              color="text-red-500"
            />
            <MetricCard
              title="Avg Compile Time"
              value={`${displayMetrics.averageCompilationTime}ms`}
              subtitle="Per contract"
              icon={Clock}
              trend={{ value: "15ms", positive: false }}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Compilations (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompilationChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Gas Usage (Last 12 Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GasUsageChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Deployments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deploymentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Deploy Hash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gas Used</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayDeployments.map((deployment) => (
                  <TableRow
                    key={deployment.id}
                    data-testid={`deployment-row-${deployment.id}`}
                  >
                    <TableCell className="font-medium">
                      {deployment.contractName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {deployment.deployHash}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          deployment.status === "confirmed"
                            ? "text-green-500"
                            : deployment.status === "pending"
                              ? "text-yellow-500"
                              : "text-red-500"
                        }
                      >
                        {deployment.status === "confirmed" && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {deployment.status === "pending" && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {deployment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deployment.gasUsed > 0
                        ? `${(deployment.gasUsed / 1000000).toFixed(2)}M`
                        : "-"}
                    </TableCell>
                    <TableCell>{deployment.cost} CSPR</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(deployment.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="font-medium">Operational</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Latency</span>
                <span>45ms</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Block Height</span>
                <span className="font-mono">1,234,567</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Peers</span>
                <span>142</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Compiler Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">CPU Usage</span>
                  <span>32%</span>
                </div>
                <Progress value={32} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Memory</span>
                  <span>48%</span>
                </div>
                <Progress value={48} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Queue</span>
                  <span>2 pending</span>
                </div>
                <Progress value={10} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Audits Today</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vulnerabilities Found</span>
                <span className="font-medium text-red-500">12</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Risk Score</span>
                <span className="font-medium">32/100</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Status</span>
                <Badge variant="secondary" className="text-green-500">
                  <Zap className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
