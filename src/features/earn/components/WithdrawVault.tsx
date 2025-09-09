"use client";

import { useState } from "react";
import { useUserContext } from "@/contexts/UserContext";
import { CopyAndPasteButton, TheButton } from "@/shared/components";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";
import { useVaultInfo, useVaultBalance } from "@/features/earn/hooks";
import {
  useEarnVault,
  EarnVaultStep,
} from "@/features/earn/hooks/useEarnVault";
import { EarnVaultModal } from "./EarnVaultModal";
import { formatUnits } from "@/shared/lib/utils";

export const WithdrawVault = ({ vaultAddress }: { vaultAddress: string }) => {
  const [amount, setAmount] = useState("0");
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const { address } = useUserContext();
  const { vaultInfo, isLoading: isVaultInfoLoading } = useVaultInfo({
    vaultId: vaultAddress,
  });
  const {
    revalidate,
    vaultBalance,
    isLoading: isVaultBalanceLoading,
  } = useVaultBalance({
    vaultId: vaultAddress,
    userAddress: address,
  });

  const { currentStep, executeWithdraw, reset, modalData } = useEarnVault({
    onSuccess: () => {
      revalidate(); // Revalidate vault balance after successful withdraw
    },
    onError: (error) => {
      // Keep modal open to show error message to user
      console.log("Withdraw error:", error);
    },
  });

  const handleWithdraw = async () => {
    if (!address) return;
    console.log("Setting modal open to true");
    setIsOpenModal(true);
    try {
      console.log("Executing withdraw...");
      await executeWithdraw({
        vaultId: vaultAddress,
        amount,
        userAddress: address,
        slippageBps: 100,
      });
    } catch (error) {
      console.log("Withdraw error caught:", error);
      // Keep modal open to show error - error handling is done in useEarnVault hook
    }
  };

  return (
    <section className="w-full space-y-6">
      <div className="flex h-full w-full flex-col gap-6 lg:flex-row lg:items-center">
        {/* Vault Address Field */}
        <div className="flex flex-col gap-2 lg:flex-1">
          <label className="text-secondary text-sm font-medium">
            Vault address
          </label>
          <div className="relative">
            <input
              id="vault-address"
              type="text"
              value={vaultAddress}
              disabled
              className="bg-surface-alt border-surface-alt text-primary w-full rounded-lg border p-3 pr-10 font-mono text-sm opacity-60"
              aria-label="Vault address (read-only)"
            />
            <CopyAndPasteButton
              textToCopy={vaultAddress}
              className="absolute top-1/2 right-3 -translate-y-1/2 bg-transparent"
            />
          </div>
          <div className="text-secondary flex w-full items-center text-xs">
            {isVaultInfoLoading || isVaultBalanceLoading ? (
              <div className="flex w-full items-center">
                <div className="skeleton h-8 w-24" />
              </div>
            ) : (
              <div className="flex w-full items-center">
                Your holding:{" "}
                {vaultBalance?.underlyingBalance[0] &&
                  Number(
                    formatUnits({
                      value: vaultBalance?.underlyingBalance[0],
                      decimals: 7,
                    }),
                  )}{" "}
                {vaultInfo?.assets[0].symbol}
              </div>
            )}
          </div>
        </div>

        {/* Amount to Withdraw */}
        <div className="flex flex-col gap-2 lg:flex-1">
          <label className="text-secondary text-sm font-medium">
            Amount to withdraw
          </label>
          <TokenAmountInput
            disabled={
              !vaultBalance?.underlyingBalance[0] ||
              vaultBalance?.underlyingBalance[0] <= 0
            }
            token={vaultInfo?.assets[0]}
            amount={amount}
            setAmount={(v) => {
              const value = v ?? "0";
              // Limit to 7 total digits (excluding decimal point)
              const digitCount = value.replace(/[^\d]/g, "").length;
              if (digitCount >= 9) {
                return; // Don't update if total digits exceed 7
              }
              setAmount(value);
            }}
            isLoading={false}
            className="bg-surface-alt border-surface-alt text-primary hide-number-spin focus:border-primary focus:ring-primary w-full rounded-lg border p-3 text-2xl font-bold outline-none focus:ring-1"
          />

          <div className="flex items-center gap-2">
            <p id="amount-value" className="text-secondary text-xs">
              ${parseFloat(amount) * 1 || "0.00"}
            </p>
            {vaultBalance?.underlyingBalance[0] &&
              vaultBalance?.underlyingBalance[0] > 0 && (
                <>
                  <p className="text-secondary text-xs">
                    Available balance:{" "}
                    {vaultBalance?.underlyingBalance[0] &&
                      Number(
                        formatUnits({
                          value: vaultBalance?.underlyingBalance[0],
                          decimals: 7,
                        }),
                      )}{" "}
                    {vaultInfo?.assets[0].symbol}
                  </p>
                  <button
                    className="text-brand cursor-pointer rounded-lg text-sm font-medium transition-colors"
                    onClick={() => {
                      const maxValue =
                        formatUnits({
                          value: vaultBalance?.underlyingBalance[0],
                          decimals: 7,
                        }) ?? "0";
                      // Limit to 7 digits and ensure it's a clean number
                      const cleanValue = parseFloat(maxValue)
                        .toFixed(7)
                        .replace(/\.?0+$/, "");
                      setAmount(cleanValue);
                    }}
                    disabled={
                      !vaultBalance?.underlyingBalance[0] ||
                      vaultBalance?.underlyingBalance[0] <= 0
                    }
                  >
                    Max
                  </button>
                </>
              )}
          </div>
        </div>

        {/* Withdraw Button */}
        <div className="flex">
          <TheButton
            onClick={handleWithdraw}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              !address ||
              !vaultBalance?.underlyingBalance[0] ||
              vaultBalance?.underlyingBalance[0] <= 0 ||
              parseFloat(amount) >
                Number(
                  formatUnits({
                    value: vaultBalance?.underlyingBalance[0],
                    decimals: 7,
                  }),
                )
            }
            className="w-full text-white lg:w-auto lg:px-8"
            type="submit"
          >
            Withdraw
          </TheButton>
        </div>
      </div>
      {isOpenModal && currentStep !== EarnVaultStep.IDLE && modalData && (
        <EarnVaultModal
          modalData={modalData}
          onClose={() => {
            reset();
            setIsOpenModal(false);
          }}
          operationType="withdraw"
        />
      )}
    </section>
  );
};
