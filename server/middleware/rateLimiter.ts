import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response } from "express";
import { logger } from "../logging/logger";

function createLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  skipFailedRequests?: boolean;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    skipFailedRequests: options.skipFailedRequests ?? false,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const supportId = logger.generateSupportId();
      logger.securityEvent("Rate limit exceeded", {
        supportId,
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      res.status(429).json({
        error: options.message,
        supportId,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
    keyGenerator: (req: Request): string => {
      return req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
    },
  });
}

export const defaultLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later.",
});

export const publicLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests. Please try again later.",
});

export const sensitiveLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests for this operation. Please wait before trying again.",
});

export const walletConnectLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many wallet connection attempts. Please wait a minute.",
  skipFailedRequests: true,
});

export const compileLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Compilation rate limit reached. Please wait before compiling again.",
});
