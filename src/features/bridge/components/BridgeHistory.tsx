"use client";

import { Modal } from "@/shared/components";
import { formatAddress } from "@/shared/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BridgeHistoryItem } from "../types/history";
import {
  clearPaymentHistoryForWallet,
  getBridgeHistoryForWallet,
  removeDuplicatePayments,
  SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY,
} from "../utils/history";

interface BridgeHistoryProps {
  walletAddress: string;
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const BridgeHistory = ({
  walletAddress,
  isModal = false,
  isOpen,
  onClose,
}: BridgeHistoryProps) => {
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
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [walletAddress]);

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

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SOROSWAP_BRIDGE_HISTORY_STORAGE_KEY) {
        loadHistory();
      }
    };

    const handleCustomEvent = () => {
      loadHistory();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("bridge-payment-completed", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("bridge-payment-completed", handleCustomEvent);
    };
  }, []);

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
      clearPaymentHistoryForWallet(walletAddress);
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

  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* <h3 className="text-primary text-lg font-semibold">Bridge History</h3> */}
        <button
          onClick={clearHistory}
          className="text-secondary hover:text-primary flex cursor-pointer items-center gap-1 self-end text-xs transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>

      <div className="max-h-[300px] space-y-2 overflow-y-auto">
        {history.map((item) => {
          const isWithdraw = "type" in item && item.type === "withdraw";
          const Icon = isWithdraw ? ArrowDownLeft : ArrowUpRight;
          const chainName = item.toChain;
          const address = item.destinationAddress;

          return (
            <div
              key={item.id}
              className="bg-surface-subtle border-surface-alt hover:bg-surface-hover rounded-lg border p-3 transition-colors"
            >
              {/* Top Section: Icon, Amount/Type, Timestamp */}
              <div className="border-surface-alt flex items-center gap-3 border-b pb-3">
                {/* Icon */}
                {item.type && (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isWithdraw
                        ? "var(--color-green-300)"
                        : "var(--color-blue-300)",
                      color: isWithdraw
                        ? "var(--color-green-800)"
                        : "var(--color-blue-800)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                )}

                {/* Amount and Type */}
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-primary text-sm font-medium">
                    {item.amount} USDC
                  </span>
                  <span className="text-secondary text-xs capitalize">
                    {item.type}
                  </span>
                </div>

                {/* Timestamp */}
                <span className="text-secondary text-xs">
                  {formatDate(item.completedAt)}
                </span>
              </div>

              {/* Bottom Section: Address/Chain and View Receipt */}
              <div className="flex items-center justify-between gap-2 pt-3">
                <span className="text-secondary text-xs">
                  To: {formatAddress(address)} on {chainName}
                </span>
                <Link
                  href={`https://invoice.rozo.ai/receipt?id=${item.paymentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary hover:text-primary flex items-center gap-1 text-xs transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Receipt
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isModal && isOpen !== undefined && onClose) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Bridge History" size="lg">
        {content}
      </Modal>
    );
  }

  return content;
};
