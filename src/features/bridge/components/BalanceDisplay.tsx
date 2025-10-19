"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface BalanceDisplayProps {
  balance: number;
  currency?: string;
  onRefresh?: () => void;
  className?: string;
}

export const BalanceDisplay = ({
  balance,
  currency = "USDC",
  onRefresh,
  className = "",
}: BalanceDisplayProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      className={`bg-surface-subtle border-surface-alt flex items-center justify-between rounded-lg border p-3 ${className}`}
    >
      <span className="text-secondary text-sm">Your Balance</span>
      <div className="flex items-center gap-2">
        <span className="text-primary text-sm font-medium">
          {balance.toFixed(2)} {currency}
        </span>
        {onRefresh && (
          <button
            type="button"
            className="border-surface-alt text-primary hover:bg-surface-hover focus-visible:ring-brand flex cursor-pointer items-center justify-center rounded-lg px-2 py-1 text-sm transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh balance"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>
        )}
      </div>
    </div>
  );
};
