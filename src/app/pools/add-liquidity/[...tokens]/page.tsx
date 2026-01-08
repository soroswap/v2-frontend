/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useCallback, useMemo, MouseEvent, useEffect } from "react";
import {
  TheButton,
  ConnectWallet,
  SettingsButton,
} from "@/shared/components/buttons";
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
import { useParams } from "next/navigation";
import { usePools } from "@/features/pools/hooks/usePools";
import { useUserPoolPositions } from "@/features/pools/hooks/useUserPoolPositions";
import { useUserBalances } from "@/shared/hooks";

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
  const params = useParams();

  // Balance hook for fetching user token balances
  const {
    getAvailableAmount,
    isLoading: isBalanceLoading,
    revalidate: revalidateBalances,
  } = useUserBalances(userAddress);

  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [addLiquidityResult, setAddLiquidityResult] =
    useState<PoolResult | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);

  // Extract token addresses from URL parameters
  const tokenAddresses = params?.tokens as string[] | undefined;
  const tokenAAddress = tokenAddresses?.[0];
  const tokenBAddress = tokenAddresses?.[1];

  // Add hooks for revalidation
  const { revalidate: revalidatePools } = usePools();
  const { revalidate: revalidateUserPositions } = useUserPoolPositions(userAddress);

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
    initialTokenAAddress: tokenAAddress,
    initialTokenBAddress: tokenBAddress,
    onSuccess: (result: PoolResult) => {
      setAddLiquidityResult(result);
      setIsSwapModalOpen(true);
      // Revalidate pools, user positions, and balances after successful add liquidity
      revalidatePools();
      revalidateUserPositions();
      revalidateBalances();
    },
    onError: (error: PoolError) => {
      console.error("Pool failed:", error);
      setAddLiquidityResult(null);
      setIsSwapModalOpen(true); // Open modal to show error
    },
    onStepChange: (step: PoolStep) => {
      if (step === PoolStep.WAITING_SIGNATURE) {
        setIsSwapModalOpen(true);
      }
    },
  });

  // Get token balances
  const tokenABalance = useMemo(() => {
    if (!TOKEN_A?.contract) return undefined;
    return getAvailableAmount(TOKEN_A.contract);
  }, [TOKEN_A?.contract, getAvailableAmount]);

  const tokenBBalance = useMemo(() => {
    if (!TOKEN_B?.contract) return undefined;
    return getAvailableAmount(TOKEN_B.contract);
  }, [TOKEN_B?.contract, getAvailableAmount]);

  // Check insufficient balance for TOKEN_A
  const hasInsufficientTokenA = useMemo(() => {
    const amountA =
      independentField === "TOKEN_A" ? typedValue : derived_TOKEN_A_Amount;
    if (!tokenABalance || !amountA) return false;
    return Number(amountA) > Number(tokenABalance);
  }, [tokenABalance, typedValue, independentField, derived_TOKEN_A_Amount]);

  // Check insufficient balance for TOKEN_B
  const hasInsufficientTokenB = useMemo(() => {
    const amountB =
      independentField === "TOKEN_B" ? typedValue : derived_TOKEN_B_Amount;
    if (!tokenBBalance || !amountB) return false;
    return Number(amountB) > Number(tokenBBalance);
  }, [tokenBBalance, typedValue, independentField, derived_TOKEN_B_Amount]);

  const hasInsufficientBalance = hasInsufficientTokenA || hasInsufficientTokenB;

  // Handle percentage button click for TOKEN_A
  const handlePercentageClickA = useCallback(
    (percentage: number) => {
      if (!tokenABalance || Number(tokenABalance) === 0) return;
      const calculatedAmount = (Number(tokenABalance) * percentage) / 100;
      const formattedAmount = calculatedAmount.toFixed(7).replace(/\.?0+$/, "");
      handleAmountChange("TOKEN_A")(formattedAmount);
    },
    [tokenABalance, handleAmountChange],
  );

  // Update URL when tokens change without triggering re-renders
  useEffect(() => {
    if (TOKEN_A?.contract || TOKEN_B?.contract) {
      const newTokenA = TOKEN_A?.contract;
      const newTokenB = TOKEN_B?.contract;

      let newUrl = "/pools/add-liquidity";
      if (newTokenA && newTokenB) {
        newUrl = `/pools/add-liquidity/${newTokenA}/${newTokenB}`;
      } else if (newTokenA) {
        newUrl = `/pools/add-liquidity/${newTokenA}`;
      }

      // Use window.history.replaceState to avoid re-renders
      if (window.location.pathname !== newUrl) {
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [TOKEN_A?.contract, TOKEN_B?.contract]);

  const onAddLiquidityPool = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleAddLiquidity();
    },
    [handleAddLiquidity],
  );

  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
      <div className="border-brand bg-surface flex w-full max-w-[480px] flex-col gap-2 rounded-2xl border p-4 shadow-xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/pools">
            <ArrowLeft className="text-primary" />
          </Link>
          <p className="text-primary text-xl sm:text-2xl">Add Liquidity</p>
          <SettingsButton onClick={() => setIsSettingsModalOpen(true)} />
        </div>
        <div className="bg-surface-subtle flex flex-col gap-2 rounded-md p-2">
          <p className="text-primary text-sm">
            <strong>Tip:</strong> When you add liquidity, you will receive LP
            tokens representing your position.
          </p>
          <p className="text-primary text-sm">
            These tokens automatically earn fees proportional to your share of
            the pool. Can be redeemed at any time.
          </p>
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
              balance={tokenABalance}
              isBalanceLoading={isBalanceLoading}
              showPercentageButtons={true}
              onPercentageClick={handlePercentageClickA}
            />

            <div className="flex items-center justify-center">
              <PlusIcon size={24} className="text-primary" />
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
            balance={tokenBBalance}
            isBalanceLoading={isBalanceLoading}
          />

          <div className="flex flex-col gap-2">
            {!userAddress ? (
              <ConnectWallet className="flex w-full justify-center" />
            ) : (
              <TheButton
                disabled={
                  !TOKEN_A ||
                  !TOKEN_B ||
                  TOKEN_A.contract === TOKEN_B.contract ||
                  !typedValue ||
                  hasInsufficientBalance
                }
                onClick={onAddLiquidityPool}
                className="bg-brand hover:bg-brand/80 disabled:bg-surface-alt relative flex h-14 w-full items-center justify-center rounded-2xl p-4 text-[20px] font-bold text-white disabled:cursor-default disabled:text-[#6d7179] dark:disabled:bg-[#2e303b]"
              >
                {!TOKEN_A || !TOKEN_B
                  ? "Select a token"
                  : !typedValue
                    ? "Enter an amount"
                    : hasInsufficientTokenA
                      ? `Insufficient ${TOKEN_A.code} balance`
                      : hasInsufficientTokenB
                        ? `Insufficient ${TOKEN_B.code} balance`
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
            operationType="add"
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
