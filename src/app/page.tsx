/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { useState, useEffect, useCallback, MouseEvent, useRef } from "react";
import {
  TheButton,
  RotateArrowButton,
  ConnectWallet,
} from "@/components/shared/components/buttons";
import { SwapPanel } from "@/components/swap";
import { useTokensList } from "@/hooks/useTokensList";
import { useUserContext } from "@/contexts";
import {
  QuoteRequest,
  SupportedProtocols,
  TokenType,
  TradeType,
} from "@/components/shared/types";
import { SwapStep, useSwap, SwapError, SwapResult } from "@/hooks/useSwap";
import { SwapModal } from "@/components/swap/SwapModal";
import { parseUnits, formatUnits } from "@/lib/utils/parseUnits";
import { useQuote } from "@/hooks/useQuote";
// import { SwapSettingsModal } from "@/components/swap/SwapSettingsModal";
// import {  SwapQuoteDetails } from "@/components/swap";

export interface Swap {
  amount: string | undefined;
  token: TokenType | null;
}

// interface SwapSettings {
//   slippageMode: "auto" | "custom";
//   customSlippage: string;
//   maxHops: number;
//   protocols: {
//     sdex: boolean;
//     soroswap: boolean;
//     phoenix: boolean;
//     aqua: boolean;
//   };
// }

// const DEFAULT_SWAP_SETTINGS: SwapSettings = {
//   slippageMode: "auto",
//   customSlippage: "1",
//   maxHops: 2,
//   protocols: {
//     sdex: true,
//     soroswap: true,
//     phoenix: true,
//     aqua: true,
//   },
// };

export default function SwapPage() {
  const { address: userAddress } = useUserContext();
  const { tokensList, isLoading } = useTokensList();
  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [activeField, setActiveField] = useState<"sell" | "buy" | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [isUserTyping, setIsUserTyping] = useState<boolean>(false);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const [isSettingsModalOpen, setIsSettingsModalOpen] =
  //   useState<boolean>(false);
  // const [swapSettings, setSwapSettings] = useState<SwapSettings>(
  //   DEFAULT_SWAP_SETTINGS,
  // );
  console.log("isUserTyping", isUserTyping);
  const { quote, isLoading: isQuoteLoading } = useQuote(quoteRequest);
  const {
    executeSwap,
    currentStep,
    isLoading: isSwapLoading,
    reset: resetSwap,
  } = useSwap({
    onSuccess: (result: SwapResult) => {
      console.log("Swap completed successfully:", result);
      setSwapResult(result);
      setIsSwapModalOpen(true);
      // resetSwap();
    },
    onError: (error: SwapError) => {
      console.error("Swap failed:", error);
      setSwapResult(null); // Clear result on error
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
    amount: undefined,
    token: null,
  });

  const [buy, setBuy] = useState<Swap>({
    amount: undefined,
    token: null,
  });

  /* Initialize the sell token with the first token in the list */
  useEffect(() => {
    if (!isLoading && tokensList.length > 0 && !sell.token) {
      setSell((prev) => ({
        ...prev,
        token: tokensList[0],
      }));
    }
  }, [isLoading, tokensList]);

  /* Update the token amount when the quote is received */
  useEffect(() => {
    if (quote && quote.tradeType === TradeType.EXACT_IN) {
      setBuy((prev) => ({
        ...prev,
        amount:
          sell.amount && Number(sell.amount) > 0
            ? formatUnits({
                value: quote.trade.expectedAmountOut?.toString() ?? "0",
              }).toString()
            : "0",
      }));
    } else if (quote && quote.tradeType === TradeType.EXACT_OUT) {
      setSell((prev) => ({
        ...prev,
        amount:
          buy.amount && Number(buy.amount) > 0
            ? formatUnits({
                value: quote.trade.expectedAmountIn?.toString() ?? "0",
              }).toString()
            : "0",
      }));
    }
  }, [quote]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);

      if (
        activeField === "sell" &&
        sell.amount &&
        Number(sell.amount) > 0 &&
        sell.token &&
        buy.token
      ) {
        setQuoteRequest({
          assetIn: sell.token.contract,
          assetOut: buy.token.contract,
          amount: parseUnits({ value: sell.amount.toString() }).toString(),
          tradeType: TradeType.EXACT_IN,
          protocols: [
            SupportedProtocols.AQUA,
            SupportedProtocols.SOROSWAP,
            SupportedProtocols.PHOENIX,
          ],
          parts: 10,
          slippageTolerance: "100",
          assetList: ["soroswap"],
          maxHops: 2,
        });
      } else if (
        activeField === "buy" &&
        buy.amount &&
        Number(buy.amount) > 0 &&
        buy.token &&
        sell.token
      ) {
        setQuoteRequest({
          assetIn: buy.token.contract,
          assetOut: sell.token.contract,
          amount: parseUnits({ value: buy.amount.toString() }).toString(),
          tradeType: TradeType.EXACT_OUT,
          protocols: [
            SupportedProtocols.AQUA,
            SupportedProtocols.SOROSWAP,
            SupportedProtocols.PHOENIX,
          ],
          parts: 10,
          slippageTolerance: "100",
          assetList: ["soroswap"],
          maxHops: 2,
        });
      }

      setActiveField(null);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [buy, sell, activeField]);

  /* Reset the amount of token when the user is still typing the amount of the other token */
  useEffect(() => {
    if (activeField === "sell" && buy.amount && Number(buy.amount) > 0) {
      setBuy((prev) => ({ ...prev, amount: undefined }));
    } else if (
      activeField === "buy" &&
      sell.amount &&
      Number(sell.amount) > 0
    ) {
      setSell((prev) => ({ ...prev, amount: undefined }));
    }
  }, [activeField]);

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

  const handleSwitchToken = useCallback(() => {
    setIsTokenSwitched(!isTokenSwitched);

    const sellCopy = { ...sell };
    const buyCopy = { ...buy };

    setSell({
      amount: buyCopy.amount,
      token: buyCopy.token,
    });

    setBuy({
      amount: sellCopy.amount,
      token: sellCopy.token,
    });
  }, [sell, buy, isTokenSwitched]);

  const handleSellAmountChange = useCallback((amount: string | undefined) => {
    setActiveField("sell");
    setIsUserTyping(true);
    setSell((prev) => ({ ...prev, amount }));
    if (amount === undefined) {
      setBuy((prev) => ({ ...prev, amount: undefined }));
    }
  }, []);

  const handleBuyAmountChange = useCallback((amount: string | undefined) => {
    setActiveField("buy");
    setIsUserTyping(true);
    setBuy((prev) => ({ ...prev, amount }));
    if (amount === undefined) {
      setSell((prev) => ({ ...prev, amount: undefined }));
    }
  }, []);

  const handleSwap = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!quote || !userAddress) {
      console.error("Missing quote or user address");
      return;
    }

    try {
      await executeSwap(quote, userAddress);
    } catch (error) {
      console.error("Swap execution failed:", error);
    }
  };

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

  return (
    <main className="flex min-h-screen items-center justify-center p-2">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xl text-white sm:text-2xl">Swap</p>
          <button
            // onClick={() => setIsSettingsModalOpen(true)}
            className="cursor-pointer rounded-full p-1 transition hover:bg-[#8866DD]/20"
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
          <div className="relative z-10">
            <SwapPanel
              label="Sell"
              amount={sell.amount ?? undefined}
              setAmount={handleSellAmountChange}
              token={sell.token}
              variant="default"
              onSelectToken={handleSelectSellToken}
              isLoading={isQuoteLoading}
            />

            <RotateArrowButton
              onClick={handleSwitchToken}
              className={cn(
                isTokenSwitched
                  ? "rotate-180 transition-transform duration-300"
                  : "rotate-0 transition-transform duration-300",
              )}
              isLoading={isQuoteLoading}
            />
          </div>
          <div>
            <SwapPanel
              label="Buy"
              amount={buy.amount ?? undefined}
              setAmount={handleBuyAmountChange}
              token={buy.token}
              variant="outline"
              onSelectToken={handleSelectBuyToken}
              isLoading={isQuoteLoading}
            />
          </div>
          {/* 
          {quote && (
            <SwapQuoteDetails
              quote={quote}
              sellToken={sell.token}
              buyToken={buy.token}
              className="mt-4"
            />
          )} */}

          <div className="flex flex-col gap-2">
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
              setSwapResult(null);
              resetSwap();
            }}
            transactionHash={swapResult?.txHash}
          />
        )}
        {/* {isSettingsModalOpen && (
          <SwapSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            settings={swapSettings}
            onSettingsChange={setSwapSettings}
          />
        )} */}
      </div>
    </main>
  );
}
