"use client";

import { useUserContext } from "@/contexts";
import { SwapPanel, SwapQuoteDetails, SwapSettingsModal } from "@/features/swap";
import { SwapError, SwapResult, SwapStep } from "@/features/swap/hooks/useSwap";
import { useSwapController } from "@/features/swap/hooks/useSwapController";
import {
  ConnectWallet,
  RotateArrowButton,
  SettingsButton,
  TheButton,
} from "@/shared/components/buttons";
import { useUserBalances } from "@/shared/hooks";
import { cn } from "@/shared/lib/utils/cn";
import dynamic from "next/dynamic";
import { MouseEvent, useCallback, useMemo, useState } from "react";

const SwapModal = dynamic(() =>
  import("../features/swap/SwapModal").then((mod) => mod.SwapModal),
);

const getSwapButtonText = (step: SwapStep): string => {
  switch (step) {
    case SwapStep.WAITING_SIGNATURE:
      return "Waiting for signature...";
    case SwapStep.SENDING_TRANSACTION:
      return "Sending transaction...";
    default:
      return "Processing...";
  }
};

export default function SwapPage() {
  const { address: userAddress } = useUserContext();

  // Balance hook for fetching user token balances
  const {
    getAvailableAmount,
    isLoading: isBalanceLoading,
    revalidate: revalidateBalances,
  } = useUserBalances(userAddress);

  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const [swapError, setSwapError] = useState<SwapError | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);

  const {
    typedValue,
    independentField,
    sellToken,
    buyToken,
    derivedSellAmount,
    derivedBuyAmount,
    isQuoteLoading,
    isSwapLoading,
    currentStep,
    modalData,
    handleAmountChange,
    handleTokenSelect,
    handleSwitchTokens,
    handleSwap,
    resetSwap,
    quote,
    quoteError,
  } = useSwapController({
    userAddress: userAddress || undefined,
    onSuccess: (result: SwapResult) => {
      setSwapResult(result);
      setIsSwapModalOpen(true);
      revalidateBalances(); // Refresh balances after successful swap
    },
    onError: (error: SwapError) => {
      console.error("Swap failed:", error);
      setSwapError(error);
    },
    onStepChange: (step: SwapStep) => {
      if (
        step === SwapStep.WAITING_SIGNATURE ||
        step === SwapStep.CREATE_TRUSTLINE ||
        step === SwapStep.SENDING_TRANSACTION ||
        step === SwapStep.SUCCESS ||
        step === SwapStep.ERROR
      ) {
        setIsSwapModalOpen(true);
      }
    },
  });

  // Get sell token balance
  const sellTokenBalance = useMemo(() => {
    if (!sellToken?.contract) return undefined;
    return getAvailableAmount(sellToken.contract);
  }, [sellToken, getAvailableAmount]);

  // Get buy token balance
  const buyTokenBalance = useMemo(() => {
    if (!buyToken?.contract) return undefined;
    return getAvailableAmount(buyToken.contract);
  }, [buyToken, getAvailableAmount]);

  // Check if user has insufficient balance for the sell token
  const hasInsufficientBalance = useMemo(() => {
    if (!sellTokenBalance || !typedValue) return false;
    const sellAmount =
      independentField === "sell" ? typedValue : derivedSellAmount;
    if (!sellAmount) return false;
    return Number(sellAmount) > Number(sellTokenBalance);
  }, [sellTokenBalance, typedValue, independentField, derivedSellAmount]);

  // Handle percentage button click for setting sell amount
  const handlePercentageClick = useCallback(
    (percentage: number) => {
      if (!sellTokenBalance || Number(sellTokenBalance) === 0) return;
      const calculatedAmount = (Number(sellTokenBalance) * percentage) / 100;
      // Format to 7 decimals (Stellar standard), remove trailing zeros
      const formattedAmount = calculatedAmount.toFixed(7).replace(/\.?0+$/, "");
      handleAmountChange("sell")(formattedAmount);
    },
    [sellTokenBalance, handleAmountChange],
  );

  const onSwitchTokens = useCallback(() => {
    setIsTokenSwitched((prev: boolean) => !prev);
    handleSwitchTokens();
  }, [handleSwitchTokens]);

  const onSwapClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleSwap();
    },
    [handleSwap],
  );

  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
      <div className="border-brand bg-surface w-full max-w-[480px] rounded-2xl border p-4 shadow-xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-primary text-xl sm:text-2xl">Swap</p>
          <SettingsButton onClick={() => setIsSettingsModalOpen(true)} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative z-10">
            <SwapPanel
              label="Sell"
              amount={
                independentField === "sell" ? typedValue : derivedSellAmount
              }
              setAmount={handleAmountChange("sell")}
              currentToken={sellToken}
              oppositeToken={buyToken}
              onSelectToken={handleTokenSelect("sell")}
              isLoading={isQuoteLoading}
              balance={sellTokenBalance}
              isBalanceLoading={isBalanceLoading}
              showPercentageButtons={true}
              onPercentageClick={handlePercentageClick}
            />

            <RotateArrowButton
              onClick={onSwitchTokens}
              className={cn(
                isTokenSwitched ? "rotate-180" : "rotate-0",
                "transition-transform duration-300",
                isQuoteLoading && "cursor-default",
              )}
              isLoading={isQuoteLoading}
              disabled={isQuoteLoading}
            />
          </div>

          <SwapPanel
            label="Buy"
            amount={independentField === "buy" ? typedValue : derivedBuyAmount}
            setAmount={handleAmountChange("buy")}
            currentToken={buyToken}
            oppositeToken={sellToken}
            onSelectToken={handleTokenSelect("buy")}
            isLoading={isQuoteLoading}
            variant="outline"
            balance={buyTokenBalance}
            isBalanceLoading={isBalanceLoading}
          />
          <SwapQuoteDetails
            quote={quote}
            sellToken={sellToken}
            buyToken={buyToken}
          />
          <div className="flex flex-col gap-2">
            {!userAddress ? (
              <ConnectWallet className="flex w-full justify-center" />
            ) : (
              <TheButton
                disabled={
                  !sellToken ||
                  !buyToken ||
                  sellToken.contract === buyToken.contract ||
                  (!quote && quoteError) ||
                  quoteError?.message === "No path found" ||
                  !typedValue ||
                  hasInsufficientBalance
                }
                onClick={onSwapClick}
                className="text-[#ededed]"
              >
                {!buyToken || !sellToken
                  ? "Select a token"
                  : !typedValue
                    ? "Enter an amount"
                    : hasInsufficientBalance
                      ? `Insufficient ${sellToken.code} balance`
                      : isSwapLoading
                        ? getSwapButtonText(currentStep)
                        : !quote && quoteError?.message === "No path found"
                          ? "Not enough liquidity"
                          : "Swap"}
              </TheButton>
            )}
          </div>
        </div>

        {isSwapModalOpen && modalData && (
          <SwapModal
            state={modalData}
            onClose={() => {
              setIsSwapModalOpen(false);
              setSwapResult(null);
              resetSwap();
            }}
            error={swapError || undefined}
            transactionHash={swapResult?.txHash}
          />
        )}
        {isSettingsModalOpen && (
          <SwapSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
