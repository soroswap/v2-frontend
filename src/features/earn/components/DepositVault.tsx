"use client";

import { useState } from "react";
import { useVaultInfo, useVaultBalance } from "@/features/earn/hooks";
import { useUserContext } from "@/contexts/UserContext";
import { ArrowRight } from "lucide-react";
import { TheButton, TokenIcon } from "@/shared/components";
import { useTokensList } from "@/shared/hooks";
import { TokenAmountInput } from "@/features/swap/TokenAmountInput";
import { EarnVaultModal } from "./EarnVaultModal";
import {
  EarnVaultStep,
  useEarnVault,
} from "@/features/earn/hooks/useEarnVault";

const DepositVaultLoading = () => {
  return (
    <section className="w-full space-y-6">
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center">
        {/* From wallet skeleton */}
        <div className="flex flex-col gap-2 lg:flex-1">
          <div className="h-5 w-20 animate-pulse rounded bg-gray-300" />
          <div className="bg-surface-alt border-surface-alt rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded-full bg-gray-300" />
              <div className="h-4 w-12 animate-pulse rounded bg-gray-300" />
            </div>
          </div>
          <div className="h-3 w-24 animate-pulse rounded bg-gray-300" />
        </div>

        {/* Amount skeleton */}
        <div className="flex h-full w-full flex-col gap-2 lg:flex-1">
          <div className="h-5 w-16 animate-pulse rounded bg-gray-300" />
          <div className="flex w-full gap-2">
            <div className="bg-surface-alt border-surface-alt w-full animate-pulse rounded-lg border p-3">
              <div className="h-8 w-20 rounded bg-gray-300" />
            </div>
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-gray-300" />
        </div>

        {/* Arrow skeleton - Hidden on mobile */}
        <div className="hidden items-center justify-center lg:flex">
          <div className="h-6 w-6 animate-pulse rounded bg-gray-300" />
        </div>

        {/* To vault skeleton */}
        <div className="flex flex-col gap-2 lg:flex-1">
          <div className="h-5 w-16 animate-pulse rounded bg-gray-300" />
          <div className="bg-surface-alt border-surface-alt rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded-full bg-gray-300" />
              <div className="h-4 w-12 animate-pulse rounded bg-gray-300" />
            </div>
          </div>
          <div className="h-3 w-20 animate-pulse rounded bg-gray-300" />
        </div>

        {/* Deposit Button skeleton */}
        <div className="flex">
          <div className="h-10 w-full animate-pulse rounded bg-gray-300 lg:w-24" />
        </div>
      </div>
    </section>
  );
};

export const DepositVault = ({ vaultAddress }: { vaultAddress: string }) => {
  const { tokenMap } = useTokensList();
  const {
    vaultInfo,
    isLoading: isVaultInfoLoading,
    isError,
  } = useVaultInfo({ vaultId: vaultAddress });
  const { address } = useUserContext();
  const [amount, setAmount] = useState("0");
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const { revalidate } = useVaultBalance({
    vaultId: vaultAddress,
    userAddress: address,
  });

  const { currentStep, executeDeposit, reset, modalData } = useEarnVault({
    onSuccess: () => {
      revalidate(); // Revalidate vault balance after successful deposit
    },
    onError: (error) => {
      // Keep modal open to show error message to user
      console.log("Deposit error:", error);
    },
  });

  const handleDeposit = async () => {
    if (!address) return;
    setIsOpenModal(true);
    try {
      await executeDeposit({
        vaultId: vaultAddress,
        amount,
        userAddress: address,
        slippageBps: 100,
      });
    } catch {
      // Keep modal open to show error - error handling is done in useEarnVault hook
    }
  };

  if (isVaultInfoLoading) {
    return <DepositVaultLoading />;
  }

  if (!isVaultInfoLoading && (!vaultInfo || isError)) {
    return (
      <div className="text-secondary flex min-h-[110px] items-center justify-center text-center">
        Vault not found
      </div>
    );
  }

  if (!vaultInfo?.assets || vaultInfo.assets.length === 0) {
    return (
      <div className="text-secondary flex min-h-[110px] items-center justify-center text-center">
        Vault assets not available
      </div>
    );
  }

  const firstAsset = vaultInfo.assets[0];

  return (
    <section className="w-full space-y-6">
      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center">
        {/* From wallet */}
        <div className="flex flex-col gap-2 lg:flex-1">
          <label className="text-secondary text-sm font-medium">
            From wallet
          </label>
          <div className="bg-surface-alt border-surface-alt rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={tokenMap[firstAsset.address]?.icon}
                name={vaultInfo.name}
                code={firstAsset.symbol}
                size={24}
              />
              <span className="text-primary text-sm font-medium">
                {firstAsset.symbol}
              </span>
            </div>
          </div>
          <span className="text-secondary h-4 text-xs">
            {/* TODO: Add balance from the user APi */}
            {/* You have - {firstAsset.symbol} */}
          </span>
        </div>

        {/* Amount */}
        <div className="flex h-full w-full flex-col gap-2 lg:flex-1">
          <label className="text-secondary text-sm font-medium">Amount</label>
          <div className="flex w-full gap-2">
            <TokenAmountInput
              token={firstAsset}
              amount={amount}
              setAmount={(v) => {
                const value = v ?? "0";
                if (value.length >= 7) {
                  return;
                }
                setAmount(value);
              }}
              isLoading={false}
              className="bg-surface-alt border-surface-alt text-primary hide-number-spin focus:border-primary focus:ring-primary w-full rounded-lg border p-3 text-2xl font-bold outline-none focus:ring-1"
            />
          </div>
          <span className="text-secondary text-xs">
            {(parseFloat(amount) < 0.01
              ? "<$0.01"
              : "$" + parseFloat(amount) * 1) || "0.00"}
          </span>
        </div>

        {/* Arrow - Hidden on mobile */}
        <div className="hidden items-center justify-center lg:flex">
          <ArrowRight className="text-secondary size-6" />
        </div>

        {/* To vault */}
        <div className="flex flex-col gap-2 lg:flex-1">
          <label className="text-secondary text-sm font-medium">To vault</label>
          <div className="bg-surface-alt border-surface-alt rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={tokenMap[firstAsset.address]?.icon}
                name={vaultInfo.name}
                code={firstAsset.symbol}
                size={24}
              />
              <span className="text-primary text-sm font-medium">
                {firstAsset.symbol}
              </span>
            </div>
          </div>
          <span className="text-secondary text-xs">
            APY {vaultInfo.apy.toFixed(2)}%
          </span>
        </div>

        {/* Deposit Button */}
        <div className="flex">
          <TheButton
            onClick={handleDeposit}
            disabled={!address || !amount || parseFloat(amount) <= 0}
            className="w-full text-white lg:w-auto lg:px-8"
          >
            {!address ? "Connect Wallet" : "Deposit"}
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
          operationType="deposit"
        />
      )}
    </section>
  );
};
