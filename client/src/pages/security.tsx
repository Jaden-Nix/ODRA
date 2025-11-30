import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Upload,
  FileCode,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AIAnalysisPanel } from "@/components/ai-analysis-panel";
import type { SecurityAnalysis } from "@shared/schema";

const SAMPLE_VULNERABLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableBank {
    mapping(address => uint256) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    // Vulnerable to reentrancy attack!
    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        // Bug: State update after external call
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= _amount;
    }
    
    // Missing access control
    function emergencyWithdraw() public {
        payable(msg.sender).transfer(address(this).balance);
    }
}`;

export default function Security() {
  const { toast } = useToast();
  const [contractCode, setContractCode] = useState(SAMPLE_VULNERABLE_CONTRACT);
  const [analysis, setAnalysis] = useState<SecurityAnalysis | null>(null);

  const { data: recentAudits, isLoading: auditsLoading } = useQuery<
    SecurityAnalysis[]
  >({
    queryKey: ["/api/security/recent"],
  });

  const analyzeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/analyze", {
        contractCode: code,
      });
      const data = await response.json();
      return data.analysis as SecurityAnalysis;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.vulnerabilities.length} potential issues`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (contractCode.length < 50) {
      toast({
        title: "Invalid Input",
        description: "Contract code must be at least 50 characters",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(contractCode);
  };

  const displayAudits = recentAudits || [];

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="security-page">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Security Analysis
        </h1>
        <p className="text-muted-foreground">
          AI-powered smart contract vulnerability detection and best practices
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Audits
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">
                +8 this week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Issues Found
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingDown className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">
                -12% from last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Risk Score
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <Progress value={32} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Contract Input
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              value={contractCode}
              onChange={(e) => setContractCode(e.target.value)}
              placeholder="Paste your Solidity contract code here..."
              className="min-h-[400px] font-mono text-sm"
              data-testid="textarea-contract-input"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {contractCode.length} characters
              </span>
              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
                data-testid="button-analyze-security"
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Analyze Security
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIAnalysisPanel
              analysis={analysis}
              isAnalyzing={analyzeMutation.isPending}
              onAnalyze={handleAnalyze}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Audits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {displayAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    data-testid={`audit-${audit.id}`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        audit.riskScore >= 50
                          ? "bg-red-500/20 text-red-500"
                          : audit.riskScore >= 30
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-green-500/20 text-green-500"
                      }`}
                    >
                      {audit.riskScore >= 50 ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        Contract #{audit.contractId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(audit.analyzedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${
                        audit.riskScore >= 50
                          ? "text-red-500"
                          : audit.riskScore >= 30
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    >
                      {audit.riskScore}/100
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
