"use client";

import { useState } from "react";
import { useUserContext } from "@/contexts";
import { ConnectWallet, TheButton } from "@/shared/components/buttons";
import { cn } from "@/shared/lib/utils/cn";
import {
  Clock,
  WalletIcon,
  Fuel,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { PREDEFINED_AMOUNTS } from "../constants/bridge";
import { UseUSDCTrustlineReturn } from "../types";
import ChainsStacked from "./ChainsStacked";

interface DepositBridgeProps {
  trustlineData: UseUSDCTrustlineReturn;
}

export const DepositBridge = ({ trustlineData }: DepositBridgeProps) => {
  const { address: userAddress } = useUserContext();
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [showAmountWarning, setShowAmountWarning] = useState(false);

  const {
    trustlineStatus,
    accountStatus,
    hasCheckedOnce,
    checkAccountAndTrustline,
    createTrustline,
    isCreating,
  } = trustlineData;

  const isConnected = !!userAddress;

  const handleAmountSelect = (value: string) => {
    if (value === "custom") {
      setSelectedAmount("custom");
      setCustomAmount("");
    } else {
      setSelectedAmount(value);
      setCustomAmount("");
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    // Check for amount warning when custom amount changes
    const amount = parseFloat(value);
    setShowAmountWarning(amount > 1000);
  };

  // Check if amount exceeds $1000 limit
  const checkAmountLimit = (amount: number) => {
    setShowAmountWarning(amount > 1000);
  };

  // Determine the current state and what action is needed
  const getBridgeState = () => {
    if (!isConnected) {
      return {
        type: "disconnected",
        message: "Connect your wallet to start bridging",
      };
    }

    // Show loading state if either status is being checked
    if (accountStatus.checking || trustlineStatus.checking) {
      return { type: "loading", message: "Checking account status..." };
    }

    // Only show warnings after we've checked the account at least once
    if (!hasCheckedOnce) {
      return { type: "loading", message: "Checking account status..." };
    }

    // Account doesn't exist - user needs XLM to create account
    if (!accountStatus.exists) {
      return {
        type: "account_creation_needed",
        message:
          "Your Stellar account doesn't exist yet. You need XLM to create it first.",
      };
    }

    // Account exists but no XLM - user needs XLM
    const xlmBalance = parseFloat(accountStatus.xlmBalance);
    if (xlmBalance < 1.5) {
      return {
        type: "insufficient_xlm",
        message: `You need at least 1.5 XLM to create a USDC trustline. Current balance: ${xlmBalance.toFixed(2)} XLM`,
      };
    }

    // Has XLM but no USDC trustline - can create trustline
    if (!trustlineStatus.exists) {
      return {
        type: "trustline_needed",
        message: "Create a USDC trustline to start bridging",
      };
    }

    // Everything is ready for deposit
    return { type: "ready", message: "Ready to deposit" };
  };

  const bridgeState = getBridgeState();

  const getActionButtonDisabled = () => {
    if (!isConnected) return true;
    if (bridgeState.type !== "ready") return true;
    if (selectedAmount === "custom") {
      return !customAmount || parseFloat(customAmount) <= 0;
    }
    return !selectedAmount;
  };

  // Handle amount selection with validation
  const handleAmountSelectWithValidation = (value: string) => {
    handleAmountSelect(value);
    if (value !== "custom") {
      const amount = parseFloat(value);
      checkAmountLimit(amount);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    checkAccountAndTrustline();
  };

  return (
    <div className="flex flex-col gap-4">
      {isConnected ? (
        <>
          {/* Status Messages */}
          {bridgeState.type === "loading" && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="border-brand h-4 w-4 animate-spin rounded-full border-b-2"></div>
              <span className="text-secondary text-sm">
                {bridgeState.message}
              </span>
            </div>
          )}

          {bridgeState.type === "account_creation_needed" && (
            <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
              <AlertTriangle className="size-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Account Creation Required
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {bridgeState.message}
                </p>
              </div>
              <button
                onClick={handleRefresh}
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

          {bridgeState.type === "insufficient_xlm" && (
            <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
              <AlertTriangle className="size-5 flex-shrink-0 text-orange-600 dark:text-orange-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Insufficient XLM Balance
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {bridgeState.message}
                </p>
              </div>
              <button
                onClick={handleRefresh}
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

          {bridgeState.type === "trustline_needed" && (
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <CheckCircle className="size-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Ready to Create USDC Trustline
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {bridgeState.message}
                </p>
              </div>
            </div>
          )}

          {/* Amount Selection - Only show when ready */}
          {bridgeState.type === "ready" && (
            <div className="flex flex-col gap-3">
              <label className="text-primary text-sm font-medium">
                Choose an amount
              </label>

              {/* Amount Grid */}
              <div className="grid grid-cols-3 gap-2">
                {PREDEFINED_AMOUNTS.map((amount) => (
                  <button
                    key={amount.value}
                    onClick={() =>
                      handleAmountSelectWithValidation(amount.value)
                    }
                    className={cn(
                      "bg-surface-subtle hover:bg-surface-hover text-primary flex h-12 items-center justify-center rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      selectedAmount === amount.value
                        ? "border-brand bg-brand/10"
                        : "hover:border-brand/20",
                    )}
                  >
                    {amount.label}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              {selectedAmount === "custom" && (
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="bg-surface-subtle border-surface-alt text-primary placeholder:text-secondary focus:border-brand w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              )}

              {/* Amount Warning */}
              {showAmountWarning && (
                <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <AlertTriangle className="size-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    Bridge amount is limited to $1000 for alpha. Join our
                    Discord for updates to unlock higher limits.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Fee/Time Indicator - Only show when ready */}
          {bridgeState.type === "ready" && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Fuel size={14} className="text-secondary" />
                <span className="text-secondary">Limited time free</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-secondary" />
                <span className="text-secondary">&lt;10s</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          {bridgeState.type === "trustline_needed" ? (
            <TheButton disabled={isCreating} onClick={createTrustline}>
              {isCreating ? "Adding USDC Trustline..." : "Add USDC Trustline"}
            </TheButton>
          ) : bridgeState.type === "ready" ? (
            <TheButton
              disabled={getActionButtonDisabled()}
              onClick={() => {
                // TODO: Implement deposit bridge logic
                console.log(
                  "Deposit bridge action:",
                  selectedAmount,
                  customAmount,
                );
              }}
              className="bg-brand hover:bg-brand/80 disabled:bg-surface-alt relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl p-4 text-[16px] font-bold text-white disabled:cursor-default disabled:text-[#6d7179] dark:disabled:bg-[#2e303b]"
            >
              Pay with USDC
              <ChainsStacked />
            </TheButton>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="space-y-3 text-center">
            <WalletIcon className="text-secondary mx-auto size-12" />
            <p className="text-secondary text-base font-medium">
              Connect your wallet to start bridging
            </p>
            <p className="text-secondary text-sm">
              Deposit USDC from any supported chain to Stellar
            </p>
          </div>
          <ConnectWallet className="flex w-full max-w-xs justify-center" />
        </div>
      )}
    </div>
  );
};
