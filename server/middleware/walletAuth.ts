import { Request, Response, NextFunction } from "express";
import { logger } from "../logging/logger";

declare global {
  namespace Express {
    interface Request {
      verifiedWallet?: {
        publicKey: string;
        verified: boolean;
      };
    }
  }
}

const PUBLIC_KEY_REGEX = /^(01|02)[a-fA-F0-9]{64}$/;

function isValidPublicKeyFormat(publicKey: string): boolean {
  return PUBLIC_KEY_REGEX.test(publicKey);
}

export function requireWalletHeader(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const walletPublicKey =
    req.headers["x-wallet-public-key"] as string ||
    req.body?.publicKeyHex ||
    req.body?.publicKey;

  if (!walletPublicKey) {
    const supportId = logger.generateSupportId();
    logger.securityEvent("Missing wallet authentication", {
      supportId,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      error: "Wallet authentication required. Please connect your wallet.",
      supportId,
    });
    return;
  }

  if (!isValidPublicKeyFormat(walletPublicKey)) {
    const supportId = logger.generateSupportId();
    logger.securityEvent("Invalid wallet public key format", {
      supportId,
      path: req.path,
      method: req.method,
      publicKeyPrefix: walletPublicKey.substring(0, 10),
    });

    res.status(401).json({
      error: "Invalid wallet format. Please reconnect your wallet.",
      supportId,
    });
    return;
  }

  req.verifiedWallet = {
    publicKey: walletPublicKey,
    verified: true,
  };

  logger.auditLog("Wallet authenticated", {
    path: req.path,
    method: req.method,
    walletPrefix: walletPublicKey.substring(0, 10) + "...",
  });

  next();
}

export function verifyWalletOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.verifiedWallet) {
    const supportId = logger.generateSupportId();
    res.status(401).json({
      error: "Wallet verification required.",
      supportId,
    });
    return;
  }

  const bodyPublicKey = req.body?.publicKeyHex || req.body?.publicKey;
  
  if (bodyPublicKey && bodyPublicKey !== req.verifiedWallet.publicKey) {
    const supportId = logger.generateSupportId();
    logger.securityEvent("Wallet mismatch detected", {
      supportId,
      path: req.path,
      headerWallet: req.verifiedWallet.publicKey.substring(0, 10) + "...",
      bodyWallet: bodyPublicKey.substring(0, 10) + "...",
    });

    res.status(403).json({
      error: "Wallet verification failed. Please reconnect your wallet.",
      supportId,
    });
    return;
  }

  next();
}

export function optionalWalletAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const walletPublicKey =
    req.headers["x-wallet-public-key"] as string ||
    req.body?.publicKeyHex ||
    req.body?.publicKey;

  // FIXED: Only set if valid format; mark as unverified (need signature verification)
  if (walletPublicKey && isValidPublicKeyFormat(walletPublicKey)) {
    req.verifiedWallet = {
      publicKey: walletPublicKey,
      verified: false, // IMPORTANT: Still requires signature verification!
    };
  }

  next();
}
