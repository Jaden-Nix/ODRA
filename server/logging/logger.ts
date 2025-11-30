import crypto from "crypto";

export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

interface LogEntry {
  timestamp: string;
  requestId: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private static instance: Logger;
  private currentRequestId: string = "";

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setRequestId(requestId: string): void {
    this.currentRequestId = requestId;
  }

  generateRequestId(): string {
    return crypto.randomBytes(8).toString("hex");
  }

  generateSupportId(): string {
    return `SUP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  }

  private formatLog(entry: LogEntry): string {
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    return `[${entry.timestamp}] [${entry.level}] [${entry.requestId}] ${entry.message}${contextStr}`;
  }

  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const sensitiveKeys = [
      "privateKey",
      "secretKey",
      "password",
      "token",
      "apiKey",
      "secret",
      "authorization",
      "signature",
    ];

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "string" && value.length > 66) {
        sanitized[key] = value.substring(0, 10) + "..." + value.substring(value.length - 6);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      requestId: this.currentRequestId || "no-request",
      level,
      message,
      context: this.sanitizeContext(context),
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case "ERROR":
        console.error(formatted);
        break;
      case "WARN":
        console.warn(formatted);
        break;
      case "DEBUG":
        if (process.env.NODE_ENV !== "production") {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("ERROR", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("WARN", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("INFO", message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("DEBUG", message, context);
  }

  securityEvent(event: string, context?: Record<string, unknown>): void {
    this.log("WARN", `[SECURITY] ${event}`, context);
  }

  auditLog(action: string, context?: Record<string, unknown>): void {
    this.log("INFO", `[AUDIT] ${action}`, context);
  }
}

export const logger = Logger.getInstance();
