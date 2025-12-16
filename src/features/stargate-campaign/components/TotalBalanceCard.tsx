"use client";

import { cn } from "@/shared/lib/utils";
import { formatCurrency, formatUnits } from "@/shared/lib/utils";
import { TrendingUp, Wallet } from "lucide-react";

interface TotalBalanceCardProps {
  /** User's vault holdings in smallest units */
  vaultHoldings: string;
  /** Vault APY percentage */
  vaultAPY: number;
  /** Whether data is loading */
  isLoading?: boolean;
  className?: string;
}

export function TotalBalanceCard({
  vaultHoldings,
  vaultAPY,
  isLoading = false,
  className,
}: TotalBalanceCardProps) {
  // Format vault holdings from smallest units (7 decimals) to readable
  const formattedHoldings = formatUnits({
    value: vaultHoldings || "0",
    decimals: 7,
  });
  const holdingsNumber = parseFloat(formattedHoldings);

  // Calculate estimated weekly earnings based on APY
  const weeklyRate = vaultAPY / 100 / 52; // Weekly rate from APY
  const weeklyEarnings = holdingsNumber * weeklyRate;
  const monthlyEstimate = holdingsNumber * (vaultAPY / 100 / 12);

  return (
    <article
      className={cn(
        // Liquid glass effect
        "relative overflow-hidden rounded-3xl p-6",
        "bg-surface/70 backdrop-blur-xl",
        "border border-primary/5",
        "shadow-xl shadow-(--color-brand)/5",
        className,
      )}
    >
      {/* Decorative gradient blur */}
      <div
        className={cn(
          "pointer-events-none absolute -bottom-10 -right-10",
          "h-40 w-40 rounded-full blur-3xl",
          "bg-brand/10",
        )}
      />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Main Balance */}
        <div className="flex flex-1 items-center justify-between md:justify-start">
          <div>
            <p className="text-secondary mb-1 text-sm font-medium">
              Total Earn Balance
            </p>
            {isLoading ? (
              <div className="bg-surface-skeleton-start h-9 w-40 animate-pulse rounded-lg" />
            ) : (
              <h2 className="text-primary text-3xl font-bold">
                {formatCurrency(holdingsNumber, "", "$")}
              </h2>
            )}
            {holdingsNumber > 0 && !isLoading && (
              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-green-500">
                <TrendingUp className="h-3 w-3" />
                <span>Earning {vaultAPY.toFixed(1)}% APY</span>
              </div>
            )}
          </div>
          <Wallet className="text-secondary/30 h-6 w-6 md:hidden" />
        </div>

        {/* Divider */}
        <div className="bg-primary/10 hidden h-16 w-px md:block" />

        {/* Stats Grid */}
        <div className="border-primary/10 grid grid-cols-2 gap-4 border-t pt-4 md:mr-8 md:flex md:gap-12 md:border-0 md:pt-0">
          {/* Weekly Earned */}
          <div>
            <p className="text-secondary mb-1 text-[10px] font-medium uppercase tracking-wide">
              Est. Weekly Earnings
            </p>
            {isLoading ? (
              <div className="bg-surface-skeleton-start h-6 w-20 animate-pulse rounded" />
            ) : (
              <>
                <h3 className="text-primary mb-0.5 text-xl font-bold">
                  ${weeklyEarnings.toFixed(2)}
                </h3>
                <p className="text-brand cursor-pointer text-[10px] font-medium hover:underline">
                  Auto-compounding
                </p>
              </>
            )}
          </div>

          {/* APY */}
          <div>
            <p className="text-secondary mb-1 text-[10px] font-medium uppercase tracking-wide">
              Current APY
            </p>
            {isLoading ? (
              <div className="bg-surface-skeleton-start h-6 w-16 animate-pulse rounded" />
            ) : (
              <>
                <h3 className="text-primary mb-0.5 text-xl font-bold">
                  {vaultAPY.toFixed(1)}%
                </h3>
                <p className="text-secondary text-[10px]">
                  ~ ${monthlyEstimate.toFixed(0)}/mo
                </p>
              </>
            )}
          </div>
        </div>

      </div>
    </article>
  );
}
