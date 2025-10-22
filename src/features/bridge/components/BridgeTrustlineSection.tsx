"use client";

import { TheButton } from "@/shared/components/buttons";
import { cn } from "@/shared/lib/utils/cn";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useBridgeState } from "../hooks/useBridgeState";
import { UseUSDCTrustlineReturn } from "../types";

interface TrustlineSectionProps {
  trustlineData: UseUSDCTrustlineReturn;
}

export const TrustlineSection = ({ trustlineData }: TrustlineSectionProps) => {
  const {
    trustlineStatus,
    accountStatus,
    checkAccountAndTrustline,
    createTrustline,
    isCreating,
    createTrustlineError,
  } = trustlineData;
  const { bridgeStateType, bridgeStateMessage } = useBridgeState(trustlineData);

  return (
    <>
      {bridgeStateType === "loading" && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="border-brand h-4 w-4 animate-spin rounded-full border-b-2"></div>
          <span className="text-secondary text-sm">{bridgeStateMessage}</span>
        </div>
      )}

      {bridgeStateType === "account_creation_needed" && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertTriangle className="size-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Account Creation Required
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              {bridgeStateMessage}
            </p>
          </div>
          <button
            onClick={checkAccountAndTrustline}
            disabled={accountStatus.checking || trustlineStatus.checking}
            className="text-orange-600 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-orange-400 dark:hover:text-orange-300"
            title="Refresh account status"
          >
            <RefreshCw
              size={16}
              className={cn(
                "transition-transform",
                (accountStatus.checking || trustlineStatus.checking) &&
                  "animate-spin",
              )}
            />
          </button>
        </div>
      )}

      {bridgeStateType === "insufficient_xlm" && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertTriangle className="size-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Insufficient XLM Balance
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              {bridgeStateMessage}
            </p>
          </div>
          <button
            onClick={checkAccountAndTrustline}
            disabled={accountStatus.checking || trustlineStatus.checking}
            className="text-orange-600 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-orange-400 dark:hover:text-orange-300"
            title="Refresh account status"
          >
            <RefreshCw
              size={16}
              className={cn(
                "transition-transform",
                (accountStatus.checking || trustlineStatus.checking) &&
                  "animate-spin",
              )}
            />
          </button>
        </div>
      )}

      {bridgeStateType === "trustline_needed" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <CheckCircle className="size-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Ready to Create USDC Trustline
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {bridgeStateMessage}
              </p>
            </div>
          </div>

          <TheButton
            disabled={isCreating}
            onClick={createTrustline}
            className="bg-brand hover:bg-brand/80 disabled:bg-surface-alt relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl p-4 text-[16px] font-bold text-white disabled:cursor-default disabled:text-[#6d7179] dark:disabled:bg-[#2e303b]"
          >
            {isCreating ? "Adding USDC Trustline..." : "Add USDC Trustline"}
          </TheButton>

          {createTrustlineError ? (
            <div className="text-accent-warning mt-2 text-sm">
              {createTrustlineError}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
};
