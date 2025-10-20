"use client";

import { useState, useEffect, useMemo } from "react";
import { useUserContext } from "@/contexts";
import { ConnectWallet, TheButton } from "@/shared/components/buttons";
import { cn } from "@/shared/lib/utils/cn";
import {
  WalletIcon,
  Loader2,
  ReceiptText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { getAddress, isAddress } from "viem";
import { PREDEFINED_AMOUNTS } from "../constants/bridge";
import { UseUSDCTrustlineReturn } from "../types";
import { Base } from "./icons/chains";
import { BalanceDisplay } from "./BalanceDisplay";
import { useWithdraw, WithdrawResult } from "../hooks/useWithdraw";
import { useBridgeState } from "../hooks/useBridgeState";
import Image from "next/image";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";

interface WithdrawBridgeProps {
  trustlineData: UseUSDCTrustlineReturn;
  onWithdrawStateChange?: (isInProgress: boolean) => void;
}

export const WithdrawBridge = ({
  trustlineData,
  onWithdrawStateChange,
}: WithdrawBridgeProps) => {
  const { address: userAddress } = useUserContext();
  const { withdraw, step } = useWithdraw();

  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [customAmountError, setCustomAmountError] = useState<string>("");
  const [evmAddress, setEvmAddress] = useState<string>("");
  const [evmAddressError, setEvmAddressError] = useState<string>("");
  const [isWithdrawLoading, setIsWithdrawLoading] = useState<boolean>(false);
  const [withdrawResult, setWithdrawResult] = useState<WithdrawResult | null>(
    null,
  );

  const {
    trustlineStatus,
    accountStatus,
    checkAccountAndTrustline,
    refreshBalance,
    createTrustline,
    isCreating,
  } = trustlineData;

  const { bridgeStateType, bridgeStateMessage } = useBridgeState(trustlineData);

  const isConnected = !!userAddress;
  const availableBalance = parseFloat(trustlineStatus.balance) || 0;
  const amount = selectedAmount === "custom" ? customAmount : selectedAmount;

  // Mock USDC token for TokenAmountInput
  const usdcToken = {
    address: "USDC",
    symbol: "USDC",
    decimals: 6,
    name: "USD Coin",
  };

  const stepToLabel = useMemo(() => {
    switch (step) {
      case "creating-payment":
        return "Preparing withdrawal";
      case "signing-transaction":
        return "Signing transaction";
      case "submitting-transaction":
        return "Sending transaction";
      case "success":
        return "Withdrawal successful";
      case "error":
        return "Withdrawal failed";
      default:
        return "Withdrawing";
    }
  }, [step]);

  // Clear all form state when user disconnects
  useEffect(() => {
    if (!isConnected) {
      setSelectedAmount("");
      setCustomAmount("");
      setCustomAmountError("");
      setEvmAddress("");
      setEvmAddressError("");
    }
  }, [isConnected]);

  // Notify parent component about withdrawal state changes
  useEffect(() => {
    if (onWithdrawStateChange) {
      onWithdrawStateChange(isWithdrawLoading);
    }
  }, [isWithdrawLoading, onWithdrawStateChange]);

  // Clear custom selection and EVM address if balance becomes 0
  useEffect(() => {
    if (availableBalance === 0) {
      if (selectedAmount === "custom") {
        setSelectedAmount("");
        setCustomAmount("");
        setCustomAmountError("");
      }
      // Clear EVM address when balance is 0
      setEvmAddress("");
      setEvmAddressError("");
    }
  }, [availableBalance, selectedAmount]);

  // Check if a predefined amount is available
  const isAmountAvailable = (amountValue: string) => {
    if (amountValue === "custom") {
      // Disable custom if balance is 0
      return availableBalance > 0;
    }
    const amount = parseFloat(amountValue);
    return amount <= availableBalance && amount > 0;
  };

  // Validate custom amount
  const validateCustomAmount = (value: string) => {
    if (!value) {
      setCustomAmountError("");
      return true;
    }

    const amount = parseFloat(value);

    if (isNaN(amount) || amount <= 0) {
      setCustomAmountError("Amount must be greater than 0");
      return false;
    }

    if (amount > availableBalance) {
      setCustomAmountError(`Insufficient balance.`);
      return false;
    }

    setCustomAmountError("");
    return true;
  };

  // Validate EVM address (Base network)
  const validateEvmAddress = (address: string) => {
    if (!address) {
      setEvmAddressError("");
      return false; // Address is required
    }

    try {
      // Use viem's isAddress for robust validation
      if (!isAddress(address)) {
        setEvmAddressError("Invalid EVM address format");
        return false;
      }

      // Normalize the address using viem's getAddress (checksum format)
      const normalizedAddress = getAddress(address);

      // Update the input with the normalized address if it's different
      if (normalizedAddress !== address) {
        setEvmAddress(normalizedAddress);
      }

      setEvmAddressError("");
      return true;
    } catch {
      setEvmAddressError("Invalid EVM address format");
      return false;
    }
  };

  const handleAmountSelect = (value: string) => {
    if (value === "custom") {
      // Only allow custom selection if balance is available
      if (availableBalance > 0) {
        setSelectedAmount("custom");
        setCustomAmount("");
        setCustomAmountError("");
      }
    } else {
      // Only allow selection if amount is available
      if (isAmountAvailable(value)) {
        setSelectedAmount(value);
        setCustomAmount("");
        setCustomAmountError("");
      }
    }
  };

  const handleCustomAmountChange = (value: string | undefined) => {
    const stringValue = value || "";
    setCustomAmount(stringValue);
    validateCustomAmount(stringValue);
  };

  const handleEvmAddressChange = (value: string) => {
    setEvmAddress(value);
    validateEvmAddress(value);
  };

  const getActionButtonDisabled = () => {
    if (!isConnected) return true;
    if (bridgeStateType !== "ready") return true;
    if (!evmAddress || !!evmAddressError) return true;
    if (selectedAmount === "custom") {
      return (
        !customAmount || parseFloat(customAmount) <= 0 || !!customAmountError
      );
    }
    if (isWithdrawLoading) return true;
    return !selectedAmount || !isAmountAvailable(selectedAmount);
  };

  const handleWithdraw = async () => {
    try {
      setIsWithdrawLoading(true);
      const result = await withdraw({
        amount: selectedAmount === "custom" ? customAmount : selectedAmount,
        address: evmAddress,
      });
      setWithdrawResult(result);
    } catch (error) {
      console.error("Withdraw failed:", error);
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  const handleViewReceipt = () => {
    if (withdrawResult) {
      window.open(
        `https://invoice.rozo.ai/receipt?id=${withdrawResult.paymentId}`,
        "_blank",
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isConnected ? (
        <>
          {/* Status Messages */}
          {bridgeStateType === "loading" && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="border-brand h-4 w-4 animate-spin rounded-full border-b-2"></div>
              <span className="text-secondary text-sm">
                {bridgeStateMessage}
              </span>
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
          )}

          {/* Balance Display - Only show when ready */}
          {bridgeStateType === "ready" && (
            <BalanceDisplay
              balance={availableBalance}
              currency="USDC"
              onRefresh={refreshBalance}
            />
          )}

          {/* Amount Selection - Only show when ready */}
          {bridgeStateType === "ready" && (
            <div className="flex flex-col gap-3">
              <label className="text-primary text-sm font-medium">
                Choose an amount
              </label>

              {/* Amount Grid */}
              <div className="grid grid-cols-3 gap-2">
                {PREDEFINED_AMOUNTS.map((amount) => {
                  const isAvailable = isAmountAvailable(amount.value);
                  const isSelected = selectedAmount === amount.value;

                  return (
                    <button
                      key={amount.value}
                      onClick={() => handleAmountSelect(amount.value)}
                      disabled={!isAvailable || isWithdrawLoading}
                      className={cn(
                        "flex h-12 items-center justify-center rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                        isAvailable && !isWithdrawLoading
                          ? cn(
                              "bg-surface-subtle hover:bg-surface-hover text-primary",
                              isSelected
                                ? "border-brand bg-brand/10"
                                : "hover:border-brand/20",
                            )
                          : "bg-surface-alt text-secondary cursor-not-allowed opacity-50",
                      )}
                    >
                      {amount.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              {selectedAmount === "custom" && (
                <div className="flex flex-col gap-2">
                  <TokenAmountInput
                    amount={customAmount}
                    setAmount={handleCustomAmountChange}
                    isLoading={isWithdrawLoading}
                    token={usdcToken}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none",
                      isWithdrawLoading
                        ? "bg-surface-alt text-secondary cursor-not-allowed opacity-50"
                        : customAmountError
                          ? "border-red-500 bg-red-50 text-red-500 placeholder:text-red-400 focus:border-red-500 dark:bg-red-900/20"
                          : "bg-surface-subtle border-surface-alt text-primary placeholder:text-secondary focus:border-brand",
                    )}
                  />
                  {customAmountError && (
                    <p className="text-xs text-red-500">{customAmountError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* EVM Address Input - Only show when ready */}
          {bridgeStateType === "ready" && (
            <div className="flex flex-col gap-2">
              <label className="text-primary text-sm font-medium">
                EVM Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={evmAddress}
                onChange={(e) => handleEvmAddressChange(e.target.value)}
                disabled={availableBalance === 0 || isWithdrawLoading}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none",
                  availableBalance === 0 || isWithdrawLoading
                    ? "bg-surface-alt text-secondary cursor-not-allowed opacity-50"
                    : evmAddressError
                      ? "border-red-500 bg-red-50 text-red-900 placeholder:text-red-400 focus:border-red-500"
                      : "bg-surface-subtle border-surface-alt text-primary placeholder:text-secondary focus:border-brand",
                )}
              />
              {evmAddressError && (
                <p className="text-xs text-red-500">{evmAddressError}</p>
              )}
            </div>
          )}

          {/* Fee/Time Indicator - Only show when ready */}
          {bridgeStateType === "ready" &&
            !!amount &&
            parseFloat(amount) > 0 && (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  <Image
                    src="/bridge/usdc.svg"
                    alt="USDC"
                    width={14}
                    height={14}
                  />
                  <span>
                    {new Intl.NumberFormat("en-US").format(parseFloat(amount))}{" "}
                    USDC
                  </span>
                  <span className="text-secondary">in</span>
                  <span>a minute</span>
                </div>
              </div>
            )}

          {/* Action Button */}
          {bridgeStateType === "trustline_needed" ? (
            <TheButton
              disabled={isCreating}
              onClick={createTrustline}
              className="bg-brand hover:bg-brand/80 disabled:bg-surface-alt relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl p-4 text-[16px] font-bold text-white disabled:cursor-default disabled:text-[#6d7179] dark:disabled:bg-[#2e303b]"
            >
              {isCreating ? "Adding USDC Trustline..." : "Add USDC Trustline"}
            </TheButton>
          ) : bridgeStateType === "ready" ? (
            <TheButton
              disabled={isWithdrawLoading || getActionButtonDisabled()}
              onClick={() => {
                handleWithdraw();
              }}
              className="bg-brand hover:bg-brand/80 disabled:bg-surface-alt relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl p-4 text-[16px] font-bold text-white disabled:cursor-default disabled:text-[#6d7179] dark:disabled:bg-[#2e303b]"
            >
              {isWithdrawLoading ? (
                <>
                  <Loader2 size={24} className="text-secondary animate-spin" />
                  <span className="text-secondary">{stepToLabel}</span>
                </>
              ) : (
                <>
                  Withdraw to Base <Base width={24} height={24} />
                </>
              )}
            </TheButton>
          ) : null}

          {bridgeStateType === "ready" && withdrawResult && (
            <TheButton
              onClick={handleViewReceipt}
              className={cn(
                "bg-surface-subtle text-primary hover:bg-surface-hover",
              )}
            >
              <ReceiptText
                size={24}
                className={cn("text-black dark:text-white")}
              />
              <span className="ml-2 text-base text-black dark:text-white">
                See Receipt
              </span>
            </TheButton>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="space-y-3 text-center">
            <WalletIcon className="text-secondary mx-auto size-12" />
            <p className="text-secondary text-base font-medium">
              Connect your wallet to start withdrawing
            </p>
            <p className="text-secondary text-sm">
              Withdraw USDC from Stellar to Base network
            </p>
          </div>
          <ConnectWallet className="flex w-full max-w-xs justify-center" />
        </div>
      )}
    </div>
  );
};
