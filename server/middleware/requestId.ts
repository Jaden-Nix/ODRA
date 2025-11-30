import { Request, Response, NextFunction } from "express";
import { logger } from "../logging/logger";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId =
    (req.headers["x-request-id"] as string) || logger.generateRequestId();

  req.requestId = requestId;
  logger.setRequestId(requestId);

  res.setHeader("X-Request-ID", requestId);

  next();
}
