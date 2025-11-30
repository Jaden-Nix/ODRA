import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Play,
  Upload,
  Shield,
  Loader2,
  Fuel,
  Clock,
  CheckCircle2,
  XCircle,
  Wand2,
  FileSearch,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CodeEditor, DEFAULT_CONTRACT } from "@/components/code-editor";
import { CompilationOutput } from "@/components/compilation-output";
import { AIAnalysisPanel } from "@/components/ai-analysis-panel";
import type { CompilationResult, SecurityAnalysis } from "@shared/schema";

interface AutopilotResult {
  optimizedCode: string;
  changes: Array<{
    type: "security" | "gas" | "readability" | "casper";
    before: string;
    after: string;
    reason: string;
  }>;
  gasEstimate: { before: number; after: number; savings: number };
  securityScore: { before: number; after: number };
  aiPowered: boolean;
}

interface CodeReviewResult {
  issues: Array<{
    id: string;
    type: "security" | "optimization" | "best-practice";
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    lineNumber?: number;
    originalCode: string;
    patchedCode: string;
    explanation: string;
  }>;
  summary: string;
  overallScore: number;
  aiPowered: boolean;
}

export default function Editor() {
  const { toast } = useToast();
  const [code, setCode] = useState(DEFAULT_CONTRACT);
  const [compilationResult, setCompilationResult] =
    useState<CompilationResult | null>(null);
  const [securityAnalysis, setSecurityAnalysis] =
    useState<SecurityAnalysis | null>(null);
  const [autopilotResult, setAutopilotResult] = useState<AutopilotResult | null>(null);
  const [codeReviewResult, setCodeReviewResult] = useState<CodeReviewResult | null>(null);

  const compileMutation = useMutation({
    mutationFn: async (contractCode: string) => {
      const response = await apiRequest("POST", "/api/compile", {
        code: contractCode,
        contractName: "Contract",
      });
      return (await response.json()) as CompilationResult;
    },
    onSuccess: (data) => {
      setCompilationResult(data);
      if (data.success) {
        toast({
          title: "Compilation Successful",
          description: `Compiled in ${data.compilationTime}ms`,
        });
      } else {
        const errorCount = data.errors?.length || 0;
        toast({
          title: "Compilation Failed",
          description: `${errorCount} error(s) found`,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Compilation Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (contractCode: string) => {
      const response = await apiRequest("POST", "/api/analyze", {
        contractCode,
      });
      const data = await response.json();
      return data.analysis as SecurityAnalysis;
    },
    onSuccess: (data) => {
      setSecurityAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: `Risk score: ${data.riskScore}/100`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deployMutation = useMutation({
    mutationFn: async () => {
      if (!compilationResult?.success) {
        throw new Error("Contract must be compiled first");
      }
      const response = await apiRequest("POST", "/api/deploy", {
        contractId: compilationResult.id,
        network: "casper-testnet",
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deployment Initiated",
        description: "Your contract is being deployed to Casper testnet",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deployment Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const autopilotMutation = useMutation({
    mutationFn: async (contractCode: string) => {
      const response = await apiRequest("POST", "/api/ai/autopilot", {
        contractCode,
      });
      return (await response.json()) as AutopilotResult;
    },
    onSuccess: (data) => {
      setAutopilotResult(data);
      toast({
        title: "AI Autopilot Complete",
        description: `${data.changes.length} optimizations applied, ${data.gasEstimate.savings}% gas savings`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Autopilot Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const codeReviewMutation = useMutation({
    mutationFn: async (contractCode: string) => {
      const response = await apiRequest("POST", "/api/ai/review", {
        contractCode,
      });
      return (await response.json()) as CodeReviewResult;
    },
    onSuccess: (data) => {
      setCodeReviewResult(data);
      toast({
        title: "Code Review Complete",
        description: `Found ${data.issues.length} issues (Score: ${data.overallScore}/100)`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Code Review Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCompile = () => {
    compileMutation.mutate(code);
  };

  const handleAnalyze = () => {
    analyzeMutation.mutate(code);
  };

  const handleDeploy = () => {
    deployMutation.mutate();
  };

  const handleAutopilot = () => {
    autopilotMutation.mutate(code);
  };

  const handleCodeReview = () => {
    codeReviewMutation.mutate(code);
  };

  const handleApplyAutopilot = () => {
    if (autopilotResult?.optimizedCode) {
      setCode(autopilotResult.optimizedCode);
      toast({
        title: "Optimized Code Applied",
        description: "The optimized code has been applied to the editor",
      });
    }
  };

  const handleApplyPatch = (patchedCode: string, originalCode: string) => {
    if (code.includes(originalCode)) {
      setCode(code.replace(originalCode, patchedCode));
      toast({
        title: "Patch Applied",
        description: "The fix has been applied to your code",
      });
    } else {
      toast({
        title: "Could not apply patch",
        description: "The original code was not found. Try applying manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="editor-page">
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <div>
          <h1 className="text-xl font-semibold">Contract Editor</h1>
          <p className="text-sm text-muted-foreground">
            Write, compile, and deploy Solidity smart contracts
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleCompile}
            disabled={compileMutation.isPending}
            data-testid="button-compile"
          >
            {compileMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Compile
          </Button>
          <Button
            variant="secondary"
            onClick={handleAutopilot}
            disabled={autopilotMutation.isPending || !code}
            data-testid="button-autopilot"
          >
            {autopilotMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            AI Autopilot
          </Button>
          <Button
            variant="secondary"
            onClick={handleCodeReview}
            disabled={codeReviewMutation.isPending || !code}
            data-testid="button-code-review"
          >
            {codeReviewMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSearch className="h-4 w-4 mr-2" />
            )}
            AI Review
          </Button>
          <Button
            variant="secondary"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !code}
            data-testid="button-analyze"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Security
          </Button>
          <Button
            variant="secondary"
            onClick={handleDeploy}
            disabled={
              !compilationResult?.success ||
              deployMutation.isPending
            }
            data-testid="button-deploy"
          >
            {deployMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Deploy
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  {compilationResult ? (
                    compilationResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {compilationResult
                      ? compilationResult.success
                        ? "Compiled"
                        : "Failed"
                      : "Not compiled"}
                  </span>
                </div>
                {compilationResult?.success && (
                  <>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Fuel className="h-3 w-3" />
                      ~{((compilationResult.bytecode.length * 61) / 1000000).toFixed(2)}M gas
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {compilationResult.compilationTime}ms
                    </Badge>
                  </>
                )}
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  height="100%"
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={30}>
            <Tabs defaultValue="output" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-2 justify-start flex-wrap gap-1">
                <TabsTrigger value="output" data-testid="tab-output">
                  Output
                </TabsTrigger>
                <TabsTrigger value="autopilot" data-testid="tab-autopilot">
                  Autopilot
                </TabsTrigger>
                <TabsTrigger value="review" data-testid="tab-review">
                  Review
                </TabsTrigger>
                <TabsTrigger value="security" data-testid="tab-security">
                  Security
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="output"
                className="flex-1 overflow-auto m-0 p-0"
              >
                <CompilationOutput
                  result={compilationResult}
                  isCompiling={compileMutation.isPending}
                />
              </TabsContent>
              <TabsContent
                value="autopilot"
                className="flex-1 overflow-auto m-0 p-4"
              >
                {autopilotMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">AI Autopilot optimizing your contract...</p>
                  </div>
                ) : autopilotResult ? (
                  <div className="flex flex-col gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Wand2 className="h-5 w-5" />
                            AI Autopilot Results
                          </CardTitle>
                          <Button size="sm" onClick={handleApplyAutopilot} data-testid="button-apply-autopilot">
                            <Zap className="h-4 w-4 mr-2" />
                            Apply All
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-md bg-muted">
                            <p className="text-xs text-muted-foreground">Gas Savings</p>
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                              {autopilotResult.gasEstimate.savings}%
                            </p>
                          </div>
                          <div className="p-3 rounded-md bg-muted">
                            <p className="text-xs text-muted-foreground">Security Score</p>
                            <p className="text-lg font-semibold">
                              {autopilotResult.securityScore.before} <ArrowRight className="h-4 w-4 inline" /> {autopilotResult.securityScore.after}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Changes ({autopilotResult.changes.length})</p>
                          {autopilotResult.changes.map((change, idx) => (
                            <div key={idx} className="p-2 rounded-md bg-muted text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={change.type === "security" ? "destructive" : "secondary"}>
                                  {change.type}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">{change.reason}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <Wand2 className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium">AI Autopilot</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically optimize your contract for security, gas efficiency, and Casper compatibility
                      </p>
                    </div>
                    <Button onClick={handleAutopilot} data-testid="button-run-autopilot">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Run Autopilot
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent
                value="review"
                className="flex-1 overflow-auto m-0 p-4"
              >
                {codeReviewMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">AI reviewing your code...</p>
                  </div>
                ) : codeReviewResult ? (
                  <div className="flex flex-col gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileSearch className="h-5 w-5" />
                            Code Review Results
                          </CardTitle>
                          <Badge variant={codeReviewResult.overallScore >= 70 ? "default" : "destructive"}>
                            Score: {codeReviewResult.overallScore}/100
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{codeReviewResult.summary}</p>
                        <div className="space-y-3">
                          {codeReviewResult.issues.map((issue) => (
                            <div key={issue.id} className="p-3 rounded-md border">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant={
                                    issue.severity === "critical" ? "destructive" :
                                    issue.severity === "high" ? "destructive" :
                                    issue.severity === "medium" ? "secondary" : "outline"
                                  }>
                                    {issue.severity}
                                  </Badge>
                                  <Badge variant="outline">{issue.type}</Badge>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleApplyPatch(issue.patchedCode, issue.originalCode)}
                                  data-testid={`button-apply-patch-${issue.id}`}
                                >
                                  Apply Fix
                                </Button>
                              </div>
                              <p className="font-medium text-sm">{issue.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                              <p className="text-xs text-muted-foreground mt-2">{issue.explanation}</p>
                            </div>
                          ))}
                          {codeReviewResult.issues.length === 0 && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-5 w-5" />
                              <span>No issues found!</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <FileSearch className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium">AI Code Review</p>
                      <p className="text-sm text-muted-foreground">
                        Get detailed code review with auto-fix patches for security, optimization, and best practices
                      </p>
                    </div>
                    <Button onClick={handleCodeReview} data-testid="button-run-review">
                      <FileSearch className="h-4 w-4 mr-2" />
                      Start Review
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent
                value="security"
                className="flex-1 overflow-auto m-0 p-4"
              >
                <AIAnalysisPanel
                  analysis={securityAnalysis}
                  isAnalyzing={analyzeMutation.isPending}
                  onAnalyze={handleAnalyze}
                />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
