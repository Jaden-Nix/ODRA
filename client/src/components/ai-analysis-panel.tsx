import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import type { SecurityAnalysis, Vulnerability } from "@shared/schema";

interface AIAnalysisPanelProps {
  analysis: SecurityAnalysis | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

function RiskScoreCircle({ score }: { score: number }) {
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: "Critical", color: "text-red-500", bg: "bg-red-500" };
    if (score >= 60) return { label: "High", color: "text-orange-500", bg: "bg-orange-500" };
    if (score >= 40) return { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500" };
    if (score >= 20) return { label: "Low", color: "text-blue-500", bg: "bg-blue-500" };
    return { label: "Safe", color: "text-green-500", bg: "bg-green-500" };
  };

  const risk = getRiskLevel(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={risk.color}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${risk.color}`}>{score}</span>
          <span className="text-xs text-muted-foreground">Risk Score</span>
        </div>
      </div>
      <Badge className={`${risk.bg} text-white`}>{risk.label} Risk</Badge>
    </div>
  );
}

function VulnerabilityCard({ vulnerability }: { vulnerability: Vulnerability }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = (severity: Vulnerability["severity"]) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-500/10";
      case "high":
        return "border-orange-500 bg-orange-500/10";
      case "medium":
        return "border-yellow-500 bg-yellow-500/10";
      case "low":
        return "border-blue-500 bg-blue-500/10";
    }
  };

  const getSeverityBadge = (severity: Vulnerability["severity"]) => {
    const colors = {
      critical: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-blue-500",
    };
    return (
      <Badge className={`${colors[severity]} text-white capitalize text-xs`}>
        {severity}
      </Badge>
    );
  };

  return (
    <div
      className={`rounded-lg border-l-4 p-3 ${getSeverityColor(vulnerability.severity)}`}
      data-testid={`vulnerability-${vulnerability.id}`}
    >
      <div
        className="flex items-start justify-between gap-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{vulnerability.type}</span>
              {getSeverityBadge(vulnerability.severity)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {vulnerability.description}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
      </div>
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Location:
            </span>
            <p className="text-xs font-mono mt-1">{vulnerability.location}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Suggested Fix:
            </span>
            <p className="text-xs mt-1">{vulnerability.fix}</p>
          </div>
          {vulnerability.cveReference && (
            <a
              href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vulnerability.cveReference}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {vulnerability.cveReference}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function AIAnalysisPanel({
  analysis,
  isAnalyzing,
  onAnalyze,
}: AIAnalysisPanelProps) {
  if (isAnalyzing) {
    return (
      <div className="flex flex-col gap-4" data-testid="ai-analysis-loading">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative">
            <Shield className="h-12 w-12 text-primary animate-pulse" />
            <div className="absolute inset-0 h-12 w-12 animate-ping">
              <Shield className="h-12 w-12 text-primary/30" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium">AI Security Analysis</p>
            <p className="text-sm text-muted-foreground">
              Scanning for vulnerabilities...
            </p>
          </div>
          <Progress value={66} className="w-48" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <div>
          <p className="font-medium">No Analysis Yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Compile your contract and run security analysis
          </p>
        </div>
        <Button onClick={onAnalyze} data-testid="button-start-analysis">
          <Shield className="h-4 w-4 mr-2" />
          Start Analysis
        </Button>
      </div>
    );
  }

  const criticalCount = analysis.vulnerabilities.filter(
    (v) => v.severity === "critical"
  ).length;
  const highCount = analysis.vulnerabilities.filter(
    (v) => v.severity === "high"
  ).length;

  return (
    <div className="flex flex-col gap-6" data-testid="ai-analysis-results">
      <div className="flex justify-center">
        <RiskScoreCircle score={analysis.riskScore} />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 rounded-lg bg-red-500/10">
          <span className="text-lg font-bold text-red-500">{criticalCount}</span>
          <p className="text-xs text-muted-foreground">Critical</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-orange-500/10">
          <span className="text-lg font-bold text-orange-500">{highCount}</span>
          <p className="text-xs text-muted-foreground">High</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-yellow-500/10">
          <span className="text-lg font-bold text-yellow-500">
            {
              analysis.vulnerabilities.filter((v) => v.severity === "medium")
                .length
            }
          </span>
          <p className="text-xs text-muted-foreground">Medium</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-500/10">
          <span className="text-lg font-bold text-blue-500">
            {analysis.vulnerabilities.filter((v) => v.severity === "low").length}
          </span>
          <p className="text-xs text-muted-foreground">Low</p>
        </div>
      </div>

      <Accordion type="single" collapsible defaultValue="vulnerabilities">
        <AccordionItem value="vulnerabilities">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vulnerabilities ({analysis.vulnerabilities.length})
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {analysis.vulnerabilities.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">No vulnerabilities detected</span>
                </div>
              ) : (
                analysis.vulnerabilities.map((vuln) => (
                  <VulnerabilityCard key={vuln.id} vulnerability={vuln} />
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="optimizations">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Gas Optimizations ({analysis.optimizations.length})
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2">
              {analysis.optimizations.map((opt, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <Zap className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{opt}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bestPractices">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Best Practices ({analysis.bestPractices.length})
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2">
              {analysis.bestPractices.map((practice, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <Lightbulb className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{practice}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="p-3 rounded-lg bg-muted/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Recommendation
        </span>
        <p className="text-sm mt-1">{analysis.recommendation}</p>
      </div>

      <Button
        variant="secondary"
        onClick={onAnalyze}
        className="w-full"
        data-testid="button-reanalyze"
      >
        <Shield className="h-4 w-4 mr-2" />
        Re-analyze Contract
      </Button>
    </div>
  );
}
