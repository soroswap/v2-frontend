"use client";

import { useState } from "react";
import { useUserContext } from "@/contexts";
import { ConnectWallet, TheButton } from "@/shared/components/buttons";
import { cn } from "@/shared/lib/utils/cn";
import { Lock, Clock, WalletIcon, Fuel } from "lucide-react";
import { PREDEFINED_AMOUNTS } from "../constants/bridge";
import { Base } from "./icons/chains";

export const WithdrawBridge = () => {
  const { address: userAddress } = useUserContext();
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");

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
  };

  const getActionButtonDisabled = () => {
    if (!isConnected) return true;
    if (selectedAmount === "custom") {
      return !customAmount || parseFloat(customAmount) <= 0;
    }
    return !selectedAmount;
  };

  return (
    <div className="flex flex-col gap-4">
      {isConnected ? (
        <>
          {/* Amount Selection */}
          <div className="flex flex-col gap-3">
            <label className="text-primary text-sm font-medium">
              Choose an amount
            </label>

            {/* Amount Grid */}
            <div className="grid grid-cols-3 gap-2">
              {PREDEFINED_AMOUNTS.map((amount) => (
                <button
                  key={amount.value}
                  onClick={() => handleAmountSelect(amount.value)}
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
