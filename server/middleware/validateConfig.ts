import { logger } from "../logging/logger";

interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfiguration(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const sepoliaRpc = process.env.SEPOLIA_RPC_ENDPOINT;
  if (sepoliaRpc) {
    if (sepoliaRpc.includes("YOUR_")) {
      warnings.push(
        "SEPOLIA_RPC_ENDPOINT contains placeholder value - bridge to Sepolia may not work"
      );
    } else {
      try {
        new URL(sepoliaRpc);
      } catch {
        warnings.push("SEPOLIA_RPC_ENDPOINT is not a valid URL");
      }
    }
  }

  const casperRpc = process.env.CASPER_RPC_ENDPOINT;
  if (casperRpc) {
    try {
      new URL(casperRpc);
    } catch {
      warnings.push("CASPER_RPC_ENDPOINT is not a valid URL");
    }
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.ALLOWED_ORIGINS) {
      warnings.push(
        "ALLOWED_ORIGINS not set - CORS will allow Replit domains only"
      );
    }
  }

  if (errors.length > 0) {
    logger.error("Configuration validation failed", { errors });
  }

  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      logger.warn(`Configuration warning: ${warning}`);
    });
  }

  if (errors.length === 0 && warnings.length === 0) {
    logger.info("Configuration validation passed");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateOnStartup(): void {
  const result = validateConfiguration();

  if (!result.valid) {
    console.error("=".repeat(60));
    console.error("CONFIGURATION ERRORS - Server cannot start safely");
    console.error("=".repeat(60));
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.error("=".repeat(60));
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn("=".repeat(60));
    console.warn("CONFIGURATION WARNINGS");
    console.warn("=".repeat(60));
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.warn("=".repeat(60));
  }
}
