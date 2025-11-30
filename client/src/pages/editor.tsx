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

export default function Editor() {
  const { toast } = useToast();
  const [code, setCode] = useState(DEFAULT_CONTRACT);
  const [compilationResult, setCompilationResult] =
    useState<CompilationResult | null>(null);
  const [securityAnalysis, setSecurityAnalysis] =
    useState<SecurityAnalysis | null>(null);

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

  const handleCompile = () => {
    compileMutation.mutate(code);
  };

  const handleAnalyze = () => {
    analyzeMutation.mutate(code);
  };

  const handleDeploy = () => {
    deployMutation.mutate();
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
        <div className="flex items-center gap-2">
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
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !code}
            data-testid="button-analyze"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Analyze
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
              <TabsList className="mx-4 mt-2 justify-start">
                <TabsTrigger value="output" data-testid="tab-output">
                  Output
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
