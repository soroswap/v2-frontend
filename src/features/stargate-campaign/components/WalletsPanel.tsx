"use client";

import { useUserContext } from "@/contexts";
import { cn, formatAddress } from "@/shared/lib/utils";
import {
  ChevronRight,
  Lock,
  Shield,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { glassCard, quickActionLink, skeleton } from "../styles";

/** Minimum XLM balance required to operate on Stellar */
const MIN_XLM_BALANCE = 4.5;

interface WalletsPanelProps {
  /** Stellar USDC balance (already formatted from Horizon API) */
  stellarUSDCBalance: string;
  /** Stellar XLM balance (already formatted from Horizon API) */
  stellarXLMBalance: string;
  /** Whether trustline data is loading */
  isLoading?: boolean;
  className?: string;
}

export function WalletsPanel({
  stellarUSDCBalance,
  stellarXLMBalance,
  isLoading = false,
  className,
}: WalletsPanelProps) {
  const { address: stellarAddress, connectWallet } = useUserContext();

  // Balance is already formatted from Horizon API (e.g., "1.9800000")
  const usdcBalanceNumber = parseFloat(stellarUSDCBalance || "0");
  const xlmBalanceNumber = parseFloat(stellarXLMBalance || "0");
  const hasLowXLMBalance = stellarAddress && xlmBalanceNumber < MIN_XLM_BALANCE;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Wallets Card */}
      <article
        className={cn(glassCard.base, glassCard.shadow, glassCard.padding.default)}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-primary text-sm font-semibold">Wallets</h3>
          <div className="bg-surface-alt flex items-center gap-1 rounded-full px-2 py-1">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                !stellarAddress && "bg-gray-400",
                stellarAddress && !hasLowXLMBalance && "bg-green-500",
                hasLowXLMBalance && xlmBalanceNumber !== 0 && "bg-yellow-500",
                hasLowXLMBalance && xlmBalanceNumber === 0 && "bg-red-500",
              )}
            />
            {hasLowXLMBalance && xlmBalanceNumber !== 0 ? (
              <span className="text-[10px] font-medium text-yellow-500">
                Warning
              </span>
            ) : hasLowXLMBalance && xlmBalanceNumber === 0 ? (
              <span className="text-[10px] font-medium text-gray-400">
                Wallet not funded
              </span>
            ) : null}
          </div>
        </div>

        {/* Wallet List */}
        <div className="flex flex-col gap-1">
          {/* Stellar Wallet */}
          {stellarAddress ? (
            <div
              className={cn(
                "group flex cursor-pointer items-center justify-between",
                "-mx-2 rounded-lg px-2 py-3",
                "transition-colors",
                "hover:bg-surface-hover/50",
              )}
            >
              <div className="flex items-center gap-3">
                {/* Stellar Icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full p-1.5",
                    "bg-surface-alt",
                  )}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-secondary h-full w-full opacity-60"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm3.5-11.5L12 12l-3.5 3.5L7 14l3-3-3-3 1.5-1.5L12 10l3.5-3.5L17 8l-3 3 3 3-1.5 1.5z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <h4 className="text-primary text-sm font-semibold">
                      Stellar
                    </h4>
                  </div>
                  <p className="text-secondary font-mono text-[10px]">
                    {formatAddress(stellarAddress)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {isLoading ? (
                  <span>
                    <div className={cn(skeleton.base, skeleton.bg, "h-4 w-20")} />
                    <div className={cn(skeleton.base, skeleton.bg, "h-4 w-20")} />
                  </span>
                ) : (
                    <span>
                      <p className="text-primary text-sm font-bold">
                        {xlmBalanceNumber.toFixed(2)}{" "}
                        <span className="text-secondary text-[10px] font-normal">
                          XLM
                        </span>
                      </p>
                      <p className="text-primary text-sm font-bold">
                        {usdcBalanceNumber.toFixed(2)}{" "}
                        <span className="text-secondary text-[10px] font-normal">
                          USDC
                        </span>
                      </p>
                    </span>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className={cn(
                "flex items-center justify-between",
                "-mx-2 rounded-lg px-2 py-3",
                "transition-colors",
                "hover:bg-surface-hover/50",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    "bg-brand/20",
                  )}
                >
                  <Lock className="text-brand h-4 w-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-primary text-sm font-semibold">
                    Connect Stellar Wallet
                  </h4>
                  <p className="text-secondary text-[10px]">
                    Required for bridge and earn
                  </p>
                </div>
              </div>
              <ChevronRight className="text-secondary h-4 w-4" />
            </button>
          )}
          {stellarAddress && hasLowXLMBalance && xlmBalanceNumber === 0 && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <p className="text-[10px] leading-tight text-red-600 dark:text-red-400">
                Wallet not funded. Please deposit at least {MIN_XLM_BALANCE} XLM to{" "}
                <span className="font-mono font-medium">
                  {formatAddress(stellarAddress)}
                </span>{" "}
                to activate your account.
              </p>
            </div>
          )}
          {stellarAddress && hasLowXLMBalance && xlmBalanceNumber > 0 && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-yellow-500/10 p-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
              <p className="text-[10px] leading-tight text-yellow-600 dark:text-yellow-400">
                Insufficient XLM balance to operate on Stellar. Please
                deposit at least {MIN_XLM_BALANCE} XLM to{" "}
                <span className="font-mono font-medium">
                  {formatAddress(stellarAddress)}
                </span>{" "}
                to continue.
              </p>
            </div>
          )}
        </div>
      </article>

      {/* Quick Actions */}
      <div className="flex flex-col gap-2">
        <Link className={cn(quickActionLink)} href="/privacy">
          <div className="flex items-center gap-3">
            <Shield className="text-secondary h-5 w-5" />
            <span className="text-sm font-medium">Security & Privacy</span>
          </div>
          <ChevronRight className="text-secondary h-4 w-4" />
        </Link>

        <Link
          className={cn(quickActionLink)}
          href="https://discord.gg/8qHbAYmZ8g"
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="text-secondary h-5 w-5" />
            <span className="text-sm font-medium">
              Help & Support
              <span className="sr-only"> (opens in a new window)</span>
            </span>
          </div>
          <ChevronRight className="text-secondary h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
