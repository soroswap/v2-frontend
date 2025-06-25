/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { useState, useEffect, useCallback, MouseEvent } from "react";
import {
  TheButton,
  RotateArrowButton,
  ConnectWallet,
} from "@/components/shared/components/buttons";
import { SwapPanel } from "@/components/swap";
import { useTokensList } from "@/hooks/useTokensList";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { useUserContext } from "@/contexts";
import { SwapRouteSplitRequest, TokenType } from "@/components/shared/types";
import { SwapStep, useSwap, SwapError, SwapResult } from "@/hooks/useSwap";
import { SwapModal } from "@/components/swap/SwapModal";
import { parseUnits } from "@/lib/utils/parseUnits";

export interface Swap {
  amount: number;
  usdValue: number | null;
  token: TokenType | null;
}

export default function SwapPage() {
  const { address: userAddress } = useUserContext();
  const { tokensList, isLoading } = useTokensList();
  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);
  const [swap, setSwap] = useState<SwapRouteSplitRequest | null>(null);
  const [activeField, setActiveField] = useState<"sell" | "buy" | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);

  const {
    executeSwap,
    currentStep,
    isLoading: isSwapLoading,
    reset: resetSwap,
  } = useSwap({
    onSuccess: (result: SwapResult) => {
      console.log("Swap completed successfully:", result);
      setIsSwapModalOpen(false);
      resetSwap();
    },
    onError: (error: SwapError) => {
      console.error("Swap failed:", error);
      // Keep modal open to show error state
    },
    onStepChange: (step: SwapStep) => {
      console.log("Swap step changed:", step);
      if (step === SwapStep.WAITING_SIGNATURE) {
        setIsSwapModalOpen(true);
      }
    },
  });

  const [sell, setSell] = useState<Swap>({
    amount: 0,
    token: null,
    usdValue: null,
  });

  const [buy, setBuy] = useState<Swap>({
    amount: 0,
    token: null,
    usdValue: null,
  });

  const { price: sellPrice, isLoading: isSellPriceLoading } = useTokenPrice(
    sell.token?.contract || null,
  );
  const { price: buyPrice, isLoading: isBuyPriceLoading } = useTokenPrice(
    buy.token?.contract || null,
  );

  const getSwapButtonText = (step: SwapStep): string => {
    switch (step) {
      case SwapStep.FETCHING_ROUTE:
        return "Finding best route...";
      case SwapStep.BUILDING_XDR:
        return "Preparing transaction...";
      case SwapStep.WAITING_SIGNATURE:
        return "Waiting for signature...";
      case SwapStep.SENDING_TRANSACTION:
        return "Sending transaction...";
      default:
        return "Processing...";
    }
  };

  useEffect(() => {
    // Only execute if we have valid prices and tokens
    if (!sellPrice || !buyPrice || !sell.token || !buy.token) return;

    if (activeField === "sell" && sell.amount >= 0) {
      // Update sell USD value
      const newSellUsdValue = sellPrice * sell.amount;

      // Calculate new buy amount based on sell
      const newBuyAmount = (sellPrice * sell.amount) / buyPrice;
      const newBuyUsdValue = buyPrice * newBuyAmount;

      setSell((prev) => ({ ...prev, usdValue: newSellUsdValue }));
      setBuy((prev) => ({
        ...prev,
        amount: newBuyAmount,
        usdValue: newBuyUsdValue,
      }));
    } else if (activeField === "buy" && buy.amount >= 0) {
      // Update buy USD value
      const newBuyUsdValue = buyPrice * buy.amount;

      // Calculate new sell amount based on buy
      const newSellAmount = newBuyUsdValue / sellPrice;
      const newSellUsdValue = sellPrice * newSellAmount;

      setBuy((prev) => ({ ...prev, usdValue: newBuyUsdValue }));
      setSell((prev) => ({
        ...prev,
        amount: newSellAmount,
        usdValue: newSellUsdValue,
      }));
    }

    // If no field is active, only update USD values
    else if (!activeField) {
      if (sell.amount >= 0) {
        const newSellUsdValue = sellPrice * sell.amount;
        setSell((prev) => ({ ...prev, usdValue: newSellUsdValue }));
      }

      if (buy.amount >= 0) {
        const newBuyUsdValue = buyPrice * buy.amount;
        setBuy((prev) => ({ ...prev, usdValue: newBuyUsdValue }));
      }
    }
  }, [
    sell.amount,
    buy.amount,
    sellPrice,
    buyPrice,
    activeField,
    sell.token,
    buy.token,
  ]);

  useEffect(() => {
    if (!isLoading && tokensList.length > 0 && !sell.token) {
      setSell((prev) => ({
        ...prev,
        token: tokensList[0],
      }));
    }
  }, [isLoading, tokensList]);

  const handleSwitchToken = useCallback(() => {
    setIsTokenSwitched(!isTokenSwitched);
    setActiveField(null);

    const sellCopy = { ...sell };
    const buyCopy = { ...buy };

    setSell({
      amount: buyCopy.amount,
      token: buyCopy.token,
      usdValue: buyCopy.usdValue,
    });

    setBuy({
      amount: sellCopy.amount,
      token: sellCopy.token,
      usdValue: sellCopy.usdValue,
    });

    if (buyCopy.token && sellCopy.token) {
      setSwap({
        assetIn: buyCopy.token.contract,
        assetOut: sellCopy.token.contract,
        amount: parseUnits({ value: buyCopy.amount.toString() }).toString(),
        tradeType: "EXACT_IN",
        protocols: ["soroswap"],
        parts: 10,
        slippageTolerance: "100",
        assetList: ["soroswap"],
        maxHops: 2,
      });
    }
  }, [sell, buy, isTokenSwitched]);

  const handleSelectSellToken = useCallback((token: TokenType | null) => {
    if (token) {
      setSell((prev) => ({
        ...prev,
        token,
      }));
    }
  }, []);

  const handleSelectBuyToken = useCallback((token: TokenType | null) => {
    if (token) {
      setBuy((prev) => ({
        ...prev,
        token,
      }));
    }
  }, []);

  const handleSellAmountChange = useCallback((amount: number) => {
    setActiveField("sell");
    setSell((prev) => ({ ...prev, amount }));

    setTimeout(() => {
      setActiveField(null);
    }, 100);
  }, []);

  const handleBuyAmountChange = useCallback((amount: number) => {
    setActiveField("buy");
    setBuy((prev) => ({ ...prev, amount }));

    setTimeout(() => {
      setActiveField(null);
    }, 100);
  }, []);

  const handleSwap = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!swap || !userAddress) {
      console.error("Missing swap data or user address");
      return;
    }

    try {
      console.log("Executing swap", swap);
      await executeSwap(swap, userAddress);
    } catch (error) {
      console.error("Swap execution failed:", error);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-2">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xl text-white sm:text-2xl">Swap</p>
          <button className="cursor-pointer rounded-full p-1 transition hover:bg-[#8866DD]/20">
            <Image
              src="/settingsIcon.svg"
              alt="Settings"
              width={38}
              height={38}
            />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative z-10">
            <SwapPanel
              label="Sell"
              amount={sell.amount || 0}
              setAmount={handleSellAmountChange}
              token={sell.token}
              usdValue={sell.usdValue?.toString() || "0"}
              variant="default"
              onSelectToken={handleSelectSellToken}
              isLoading={isSellPriceLoading}
            />

            <RotateArrowButton
              onClick={handleSwitchToken}
              className={cn(
                isTokenSwitched
                  ? "rotate-180 transition-transform duration-300"
                  : "rotate-0 transition-transform duration-300",
              )}
            />
          </div>
          <div>
            <SwapPanel
              label="Buy"
              amount={buy.amount || 0}
              setAmount={handleBuyAmountChange}
              token={buy.token}
              usdValue={buy.usdValue?.toString() || "0"}
              variant="outline"
              onSelectToken={handleSelectBuyToken}
              isLoading={isBuyPriceLoading}
            />
          </div>
          <div className="flex flex-col">
            {!userAddress ? (
              <ConnectWallet className="flex w-full justify-center" />
            ) : (
              <TheButton
                disabled={!buy.token || !sell.token}
                className={cn(
                  "btn relative h-14 w-full rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80",
                )}
                onClick={handleSwap}
              >
                {!buy.token || !sell.token
                  ? "Select a token"
                  : isSwapLoading
                    ? getSwapButtonText(currentStep)
                    : "Swap"}
              </TheButton>
            )}
          </div>
        </div>
        {isSwapModalOpen && (
          <SwapModal
            currentStep={currentStep}
            onClose={() => {
              setIsSwapModalOpen(false);
              resetSwap();
            }}
          />
        )}
      </div>
    </main>
  );
}
