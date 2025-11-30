import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CompilationResult } from "@shared/schema";

interface CompilationOutputProps {
  result: CompilationResult | null;
  isCompiling: boolean;
}

export function CompilationOutput({
  result,
  isCompiling,
}: CompilationOutputProps) {
  const [isAbiOpen, setIsAbiOpen] = useState(false);
  const [isBytecodeOpen, setIsBytecodeOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isCompiling) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Compiling contract...</span>
        </div>
        <div className="h-1 w-48 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse rounded-full" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
        <Clock className="h-8 w-8" />
        <span className="text-sm">No compilation results yet</span>
        <span className="text-xs">Click "Compile" to start</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4" data-testid="compilation-output">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {result.success ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-semibold">
            {result.success ? "Compilation Successful" : "Compilation Failed"}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {result.compilationTime}ms
        </Badge>
      </div>

      {result.errors && result.errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Errors ({result.errors.length})
            </span>
          </div>
          <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20">
            {result.errors.map((error, index) => (
              <pre
                key={index}
                className="text-xs text-red-500 font-mono whitespace-pre-wrap"
              >
                {error}
              </pre>
            ))}
          </div>
        </div>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Warnings ({result.warnings.length})
            </span>
          </div>
          <div className="rounded-lg bg-yellow-500/10 p-3 border border-yellow-500/20">
            {result.warnings.map((warning, index) => (
              <pre
                key={index}
                className="text-xs text-yellow-600 dark:text-yellow-400 font-mono whitespace-pre-wrap"
              >
                {warning}
              </pre>
            ))}
          </div>
        </div>
      )}

      {result.success && (
        <>
          <Collapsible open={isAbiOpen} onOpenChange={setIsAbiOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-3"
                data-testid="button-toggle-abi"
              >
                <div className="flex items-center gap-2">
                  {isAbiOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">ABI</span>
                  <Badge variant="secondary" className="text-xs">
                    {result.abi.length} entries
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(JSON.stringify(result.abi, null, 2), "abi");
                  }}
                >
                  {copiedField === "abi" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 p-3 rounded-lg bg-muted text-xs font-mono overflow-auto max-h-48">
                {JSON.stringify(result.abi, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={isBytecodeOpen} onOpenChange={setIsBytecodeOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-3"
                data-testid="button-toggle-bytecode"
              >
                <div className="flex items-center gap-2">
                  {isBytecodeOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">Wasm Bytecode</span>
                  <Badge variant="secondary" className="text-xs">
                    {result.bytecode.length} chars
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(result.bytecode, "bytecode");
                  }}
                >
                  {copiedField === "bytecode" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 p-3 rounded-lg bg-muted text-xs font-mono overflow-auto max-h-32 break-all">
                {result.bytecode}
              </pre>
            </CollapsibleContent>
          </Collapsible>

          {result.gasEstimates && Object.keys(result.gasEstimates).length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Gas Estimates</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.gasEstimates).map(([key, value]) => {
                  if (typeof value === "object" && value !== null) {
                    return Object.entries(value).map(([subKey, subValue]) => (
                      <div
                        key={`${key}-${subKey}`}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted text-xs"
                      >
                        <span className="text-muted-foreground capitalize">
                          {subKey}
                        </span>
                        <span className="font-mono font-medium">
                          {typeof subValue === "number" ? subValue.toLocaleString() : String(subValue)}
                        </span>
                      </div>
                    ));
                  }
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted text-xs"
                    >
                      <span className="text-muted-foreground capitalize">
                        {key}
                      </span>
                      <span className="font-mono font-medium">
                        {typeof value === "number" ? value.toLocaleString() : String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
