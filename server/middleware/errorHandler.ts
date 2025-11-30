import { Request, Response, NextFunction } from "express";
import { logger } from "../logging/logger";

export interface SanitizedErrorResponse {
  error: string;
  supportId: string;
}

const genericMessages: Record<string, string> = {
  wallet: "Wallet operation failed. Please try again.",
  deployment: "Deployment operation failed. Please try again.",
  staking: "Staking operation failed. Please try again.",
  bridge: "Bridge operation failed. Please try again.",
  compilation: "Compilation failed. Please check your code.",
  analysis: "Analysis failed. Please try again.",
  validation: "Invalid request data. Please check your input.",
  authorization: "Authorization failed. Please reconnect your wallet.",
  network: "Network error. Please try again later.",
  default: "Operation failed. Please try again.",
};

export function formatErrorResponse(
  error: unknown,
  category: keyof typeof genericMessages = "default"
): SanitizedErrorResponse {
  const supportId = logger.generateSupportId();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error(`Error in ${category} operation`, {
    supportId,
    category,
    errorMessage,
    stack,
  });

  return {
    error: genericMessages[category] || genericMessages.default,
    supportId,
  };
}

export function isZodError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "ZodError"
  );
}

export function formatValidationError(): SanitizedErrorResponse {
  return formatErrorResponse(new Error("Validation failed"), "validation");
}

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const supportId = logger.generateSupportId();

  logger.error("Unhandled error", {
    supportId,
    path: req.path,
    method: req.method,
    errorMessage: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: "An unexpected error occurred. Please try again.",
    supportId,
  });
}
