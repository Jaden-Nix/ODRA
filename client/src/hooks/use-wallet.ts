import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ConnectedWallet } from "@shared/schema";

export interface WalletState {
  publicKey: string | null;
  accountHash: string | null;
  balanceCSPR: number;
  balanceInMotes: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  networkId: string | null;
}

const WALLET_STORAGE_KEY = "odra_wallet_pubkey";

export function useWallet() {
  const queryClient = useQueryClient();
  
  const [walletState, setWalletState] = useState<WalletState>({
    publicKey: null,
    accountHash: null,
    balanceCSPR: 0,
    balanceInMotes: "0",
    isConnected: false,
    isConnecting: false,
    error: null,
    networkId: null,
  });

  const connectMutation = useMutation({
    mutationFn: async (publicKeyHex: string) => {
      const response = await apiRequest("POST", "/api/wallet/connect", {
        publicKeyHex,
      });
      return response as unknown as ConnectedWallet;
    },
    onSuccess: (data) => {
      setWalletState({
        publicKey: data.publicKey,
        accountHash: data.accountHash,
        balanceCSPR: data.balanceInCSPR,
        balanceInMotes: data.balanceInMotes,
        isConnected: true,
        isConnecting: false,
        error: null,
        networkId: data.networkId,
      });
      localStorage.setItem(WALLET_STORAGE_KEY, data.publicKey);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
    onError: (error: Error) => {
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Failed to connect wallet",
      }));
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!walletState.publicKey) return;
      await apiRequest("POST", "/api/wallet/disconnect", {
        publicKey: walletState.publicKey,
      });
    },
    onSuccess: () => {
      setWalletState({
        publicKey: null,
        accountHash: null,
        balanceCSPR: 0,
        balanceInMotes: "0",
        isConnected: false,
        isConnecting: false,
        error: null,
        networkId: null,
      });
      localStorage.removeItem(WALLET_STORAGE_KEY);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
    onError: (error: Error) => {
      setWalletState((prev) => ({
        ...prev,
        error: error.message || "Failed to disconnect wallet",
      }));
    },
  });

  const refreshBalanceMutation = useMutation({
    mutationFn: async () => {
      if (!walletState.publicKey) return null;
      const response = await apiRequest("POST", "/api/wallet/balance", {
        publicKey: walletState.publicKey,
      });
      return response as unknown as { balanceInCSPR: number; balanceInMotes: string };
    },
    onSuccess: (data) => {
      if (data) {
        setWalletState((prev) => ({
          ...prev,
          balanceCSPR: data.balanceInCSPR,
          balanceInMotes: data.balanceInMotes,
        }));
      }
    },
  });

  const { data: walletStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["/api/wallet/status", walletState.publicKey],
    enabled: false,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const savedKey = localStorage.getItem(WALLET_STORAGE_KEY);
    if (savedKey && !walletState.isConnected && !walletState.isConnecting) {
      connectWallet(savedKey);
    }
  }, []);

  const connectWallet = useCallback((publicKeyHex: string) => {
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));
    connectMutation.mutate(publicKeyHex);
  }, [connectMutation]);

  const disconnectWallet = useCallback(() => {
    disconnectMutation.mutate();
  }, [disconnectMutation]);

  const refreshBalance = useCallback(() => {
    refreshBalanceMutation.mutate();
  }, [refreshBalanceMutation]);

  const checkSufficientBalance = useCallback((requiredCSPR: number): boolean => {
    return walletState.balanceCSPR >= requiredCSPR;
  }, [walletState.balanceCSPR]);

  const formatBalance = useCallback((balance?: number): string => {
    const bal = balance ?? walletState.balanceCSPR;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(bal);
  }, [walletState.balanceCSPR]);

  const shortenAddress = useCallback((address?: string | null): string => {
    const addr = address ?? walletState.accountHash;
    if (!addr) return "";
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  }, [walletState.accountHash]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    checkSufficientBalance,
    formatBalance,
    shortenAddress,
    isPending: connectMutation.isPending || disconnectMutation.isPending,
    isRefreshing: refreshBalanceMutation.isPending,
  };
}

export function validatePublicKey(publicKeyHex: string): { valid: boolean; error?: string } {
  if (publicKeyHex.length !== 66) {
    return { valid: false, error: "Public key must be 66 characters" };
  }

  const prefix = publicKeyHex.substring(0, 2);
  if (prefix !== "01" && prefix !== "02") {
    return { valid: false, error: "Invalid public key prefix (must be 01 or 02)" };
  }

  if (!/^[0-9a-fA-F]+$/.test(publicKeyHex)) {
    return { valid: false, error: "Public key must be hexadecimal" };
  }

  return { valid: true };
}
