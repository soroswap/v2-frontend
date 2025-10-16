"use client";

import { useState, useEffect } from "react";
import { useUserContext } from "@/contexts";
import { ConnectWallet, TheButton } from "@/shared/components/buttons";
import { cn } from "@/shared/lib/utils/cn";
import { Lock, Clock, WalletIcon, Fuel } from "lucide-react";
import { getAddress, isAddress } from "viem";
import { PREDEFINED_AMOUNTS } from "../constants/bridge";
import { UseUSDCTrustlineReturn } from "../types";
import { Base } from "./icons/chains";

interface WithdrawBridgeProps {
  trustlineData: UseUSDCTrustlineReturn;
}

export const WithdrawBridge = ({ trustlineData }: WithdrawBridgeProps) => {
  const { address: userAddress } = useUserContext();
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [customAmountError, setCustomAmountError] = useState<string>("");
  const [evmAddress, setEvmAddress] = useState<string>("");
  const [evmAddressError, setEvmAddressError] = useState<string>("");

  // For withdraw, we might want to show account status as well
  const { trustlineStatus } = trustlineData;

  const isConnected = !!userAddress;
  const availableBalance = parseFloat(trustlineStatus.balance) || 0;

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
        setEvmAddressError("Invalid Base network address format");
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
    } catch (error) {
      setEvmAddressError("Invalid Base network address format");
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

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    validateCustomAmount(value);
  };

  const handleEvmAddressChange = (value: string) => {
    setEvmAddress(value);
    validateEvmAddress(value);
  };

  const getActionButtonDisabled = () => {
    if (!isConnected) return true;
    if (!evmAddress || !!evmAddressError) return true;
    if (selectedAmount === "custom") {
      return (
        !customAmount || parseFloat(customAmount) <= 0 || !!customAmountError
      );
    }
    return !selectedAmount || !isAmountAvailable(selectedAmount);
  };

  return (
    <div className="flex flex-col gap-4">
      {isConnected ? (
        <>
          {/* Balance Display */}
          <div className="bg-surface-subtle border-surface-alt flex items-center justify-between rounded-lg border p-3">
            <span className="text-secondary text-sm">Available Balance</span>
            <span className="text-primary text-sm font-medium">
              {availableBalance.toFixed(2)} USDC
            </span>
          </div>

          {/* Amount Selection */}
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
                    disabled={!isAvailable}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-lg border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                      isAvailable
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
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none",
                    customAmountError
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

          {/* EVM Address Input */}
          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-medium">
              Base Network Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={evmAddress}
              onChange={(e) => handleEvmAddressChange(e.target.value)}
              disabled={availableBalance === 0}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none",
                availableBalance === 0
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

          {/* Fee/Time Indicator */}
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

          {/* Action Button */}
          <TheButton
            disabled={getActionButtonDisabled()}
            onClick={() => {
              // TODO: Implement withdraw bridge logic
              console.log(
                "Withdraw bridge action:",
                selectedAmount,
                customAmount,
                evmAddress,
              );
            }}
            className="bg-brand hover:bg-brand/80 disabled:bg-surface-alt relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl p-4 text-[16px] font-bold text-white disabled:cursor-default disabled:text-[#6d7179] dark:disabled:bg-[#2e303b]"
          >
            Withdraw to Base <Base width={24} height={24} />
          </TheButton>
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
