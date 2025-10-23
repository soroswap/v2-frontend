"use client";

import { formatAddress } from "@/shared/lib/utils";
import { Clock, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BridgeHistoryItem } from "../types/history";
import {
  getBridgeHistoryForWallet,
  removeDuplicatePayments,
  SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY,
} from "../utils/history";

interface BridgeHistoryProps {
  walletAddress: string;
}

export const BridgeHistory = ({ walletAddress }: BridgeHistoryProps) => {
  const [history, setHistory] = useState<BridgeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<
    string | null
  >(null);

  const loadHistory = useCallback(() => {
    try {
      // First, clean up any existing duplicates
      removeDuplicatePayments(walletAddress);

      const bridgeHistory = getBridgeHistoryForWallet(walletAddress);

      // Sort by date descending (newest first)
      const sortedHistory = bridgeHistory.sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      );

      setHistory(sortedHistory);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load history on mount and when wallet address changes
  useEffect(() => {
    // Clear history when wallet changes
    if (currentWalletAddress && currentWalletAddress !== walletAddress) {
      setHistory([]);
    }

    setCurrentWalletAddress(walletAddress);
    setIsLoading(true);
    loadHistory();
  }, [walletAddress, loadHistory, currentWalletAddress]);

  // Listen for storage changes to refetch when payment is completed
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY) {
        loadHistory();
      }
    };

    const handleCustomEvent = () => {
      loadHistory();
    };

    // Listen for storage changes (works across tabs)
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom payment completed events (works within same tab)
    window.addEventListener("bridge-payment-completed", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("bridge-payment-completed", handleCustomEvent);
    };
  }, [loadHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY);
      setHistory([]);
    } catch (error) {
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-secondary text-sm">Loading history...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <Clock className="text-secondary h-8 w-8" />
        <p className="text-secondary text-sm">No bridge history yet</p>
        <p className="text-secondary text-xs">
          Your completed bridge transactions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-primary text-lg font-semibold">Bridge History</h3>
        <button
          onClick={clearHistory}
          className="text-secondary hover:text-primary flex cursor-pointer items-center gap-1 text-xs transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>

      <div className="max-h-[300px] space-y-2 overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-surface-subtle border-surface-alt hover:bg-surface-hover flex flex-col items-center justify-between gap-2 rounded-lg border p-3 transition-colors"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-primary text-sm font-medium">
                {item.amount} USDC
              </span>
              <span className="text-secondary text-xs">
                {formatDate(item.completedAt)}
              </span>
            </div>

            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-secondary text-xs">
                    To: {formatAddress(item.destinationAddress)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-secondary text-xs">
                    ID: {item.paymentId}
                  </span>
                </div>
              </div>
              <Link
                href={`https://invoice.rozo.ai/receipt?id=${item.paymentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:text-primary mt-auto flex items-center gap-1 text-xs transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
