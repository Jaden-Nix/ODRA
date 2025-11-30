import cors, { CorsOptions } from "cors";
import { Request } from "express";
import { logger } from "../logging/logger";

const isDevelopment = process.env.NODE_ENV !== "production";

function getAllowedOrigins(): string[] {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  }

  if (isDevelopment) {
    return [
      "http://localhost:5000",
      "http://localhost:3000",
      "http://127.0.0.1:5000",
      "http://127.0.0.1:3000",
      "http://0.0.0.0:5000",
    ];
  }

  return [];
}

const corsOptions: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    const allowedOrigins = getAllowedOrigins();

    if (!origin) {
      callback(null, true);
      return;
    }

    if (isDevelopment) {
      callback(null, true);
      return;
    }

    if (origin.endsWith(".replit.dev") || origin.endsWith(".repl.co")) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    logger.securityEvent("CORS blocked origin", {
      origin,
      allowedOrigins,
    });

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Wallet-Public-Key",
    "X-Request-ID",
  ],
  exposedHeaders: ["X-Request-ID", "Retry-After"],
  maxAge: 86400,
};

export const corsMiddleware = cors(corsOptions);

export function securityHeaders(req: any, res: any, next: any): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
}
