"use client";

import Image from "next/image";
import { useState, useCallback, MouseEvent } from "react";
import { TheButton, ConnectWallet } from "@/shared/components/buttons";
import { SwapPanel } from "@/features/swap";
import { useUserContext } from "@/contexts";
import { PoolsSettingsModal } from "@/features/pools/components/PoolsSettingsModal";
import { ArrowLeft, PlusIcon } from "lucide-react";
import Link from "next/link";
import { usePoolsController } from "@/features/pools/hooks/usePoolsController";
import {
  PoolError,
  PoolResult,
  PoolStep,
} from "@/features/pools/hooks/usePool";
import { PoolModal } from "@/features/pools/components/PoolModal";

const getSwapButtonText = (step: PoolStep): string => {
  switch (step) {
    case PoolStep.ADD_LIQUIDITY:
      return "Adding liquidity...";
    case PoolStep.WAITING_SIGNATURE:
      return "Waiting for signature...";
    case PoolStep.SENDING_TRANSACTION:
      return "Sending transaction...";
    default:
      return "Processing...";
  }
};

export default function PoolsAddLiquidityPage() {
  const { address: userAddress } = useUserContext();

  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [addLiquidityResult, setAddLiquidityResult] =
    useState<PoolResult | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);

  console.log("addLiquidityResult", addLiquidityResult);

  const {
    typedValue,
    independentField,
    TOKEN_A,
    TOKEN_B,
    derived_TOKEN_A_Amount,
    derived_TOKEN_B_Amount,
    isQuoteLoading,
    isSwapLoading,
    currentStep,
    handleAmountChange,
    handleTokenSelect,
    handleAddLiquidity,
    resetSwap,
  } = usePoolsController({
    onSuccess: (result: PoolResult) => {
      setAddLiquidityResult(result);
      setIsSwapModalOpen(true);
    },
    onError: (error: PoolError) => {
      console.error("Pool failed:", error);
      setAddLiquidityResult(null);
    },
    onStepChange: (step: PoolStep) => {
      if (step === PoolStep.WAITING_SIGNATURE) {
        setIsSwapModalOpen(true);
      }
    },
  });

  const onAddLiquidityPool = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleAddLiquidity();
    },
    [handleAddLiquidity],
  );

  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/pools">
            <ArrowLeft />
          </Link>
          <p className="text-xl text-white sm:text-2xl">Add Liquidity</p>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="cursor-pointer rounded-full p-1 hover:bg-[#8866DD]/20"
          >
            <Image
              src="/settingsIcon.svg"
              alt="Settings"
              width={38}
              height={38}
            />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-4">
            <SwapPanel
              label=""
              amount={
                independentField === "TOKEN_A"
                  ? typedValue
                  : derived_TOKEN_A_Amount
              }
              setAmount={handleAmountChange("TOKEN_A")}
              currentToken={TOKEN_A}
              oppositeToken={TOKEN_B}
              onSelectToken={handleTokenSelect("TOKEN_A")}
              isLoading={isQuoteLoading}
            />

            <div className="flex items-center justify-center">
              <PlusIcon size={24} />
            </div>
          </div>

          <SwapPanel
            label=""
            amount={
              independentField === "TOKEN_B"
                ? typedValue
                : derived_TOKEN_B_Amount
            }
            setAmount={handleAmountChange("TOKEN_B")}
            currentToken={TOKEN_B}
            oppositeToken={TOKEN_A}
            onSelectToken={handleTokenSelect("TOKEN_B")}
            isLoading={isQuoteLoading}
            variant="outline"
          />

          <div className="flex flex-col gap-2">
            {!userAddress ? (
              <ConnectWallet className="flex w-full justify-center" />
            ) : (
              <TheButton
                disabled={
                  !TOKEN_A || !TOKEN_B || TOKEN_A.contract === TOKEN_B.contract
                }
                onClick={onAddLiquidityPool}
                className="btn relative h-14 w-full rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80"
              >
                {!TOKEN_A || !TOKEN_B
                  ? "Select a token"
                  : isSwapLoading
                    ? getSwapButtonText(currentStep)
                    : "Add liquidity"}
              </TheButton>
            )}
          </div>
        </div>

        {isSwapModalOpen && (
          <PoolModal
            currentStep={currentStep}
            onClose={() => {
              setIsSwapModalOpen(false);
              setAddLiquidityResult(null);
              resetSwap();
            }}
            transactionHash={addLiquidityResult?.txHash}
          />
        )}

        {isSettingsModalOpen && (
          <PoolsSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />
        )}
      </div>
    </main>
  );
}

//TODO In Remove Liquidity:
// 1. lp - balance = user- position
// 2. xlm / eurc reserveA / reserve B
// 3. Total LP should be after the calculation don't need now.
