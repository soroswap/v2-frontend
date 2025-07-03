/* eslint-disable react-hooks/exhaustive-deps */
// SwapPage.tsx
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  useState,
  useReducer,
  useEffect,
  useCallback,
  MouseEvent,
  useRef,
  useMemo,
} from "react";
import {
  TheButton,
  RotateArrowButton,
  ConnectWallet,
} from "@/components/shared/components/buttons";
import { SwapPanel, SwapModal, SwapSettingsModal } from "@/components/swap";
import { useTokensList } from "@/hooks/useTokensList";
import { useUserContext } from "@/contexts";
import { QuoteRequest, TokenType, TradeType } from "@/components/shared/types";
import { SwapStep, useSwap, SwapError, SwapResult } from "@/hooks/useSwap";
import { parseUnits, formatUnits } from "@/lib/utils/parseUnits";
import { useQuote } from "@/hooks/useQuote";
import { useSwapSettingsStore } from "@/contexts/store/swap-settings";

// New State based on Soroswap/Uniswap pattern
type IndependentField = "sell" | "buy";

interface SwapState {
  typedValue: string;
  independentField: IndependentField;
  sellToken: TokenType | null;
  buyToken: TokenType | null;
}

const initialSwapState: SwapState = {
  typedValue: "",
  independentField: "sell",
  sellToken: null,
  buyToken: null,
};

type SwapAction =
  | { type: "TYPE_INPUT"; field: IndependentField; typedValue: string }
  | { type: "SET_TOKEN"; field: IndependentField; token: TokenType | null }
  | { type: "SWITCH_TOKENS" };

function swapReducer(state: SwapState, action: SwapAction): SwapState {
  switch (action.type) {
    case "TYPE_INPUT":
      return {
        ...state,
        typedValue: action.typedValue,
        independentField: action.field,
      };
    case "SET_TOKEN":
      return {
        ...state,
        [action.field === "sell" ? "sellToken" : "buyToken"]: action.token,
      };
    case "SWITCH_TOKENS":
      return {
        ...state,
        sellToken: state.buyToken,
        buyToken: state.sellToken,
        independentField: state.independentField === "sell" ? "buy" : "sell",
      };
    default:
      return state;
  }
}

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
  const { tokensList, isLoading } = useTokensList();
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { swapSettings } = useSwapSettingsStore();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTokenSwitched, setIsTokenSwitched] = useState(false);

  const [swapState, dispatchSwap] = useReducer(swapReducer, initialSwapState);

  const { typedValue, independentField, sellToken, buyToken } = swapState;

  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const { quote, isLoading: isQuoteLoading } = useQuote(quoteRequest);

  const {
    executeSwap,
    currentStep,
    isLoading: isSwapLoading,
    reset: resetSwap,
  } = useSwap({
    onSuccess: (result: SwapResult) => {
      setSwapResult(result);
      setIsSwapModalOpen(true);
    },
    onError: (error: SwapError) => {
      console.error("Swap failed:", error);
      setSwapResult(null);
    },
    onStepChange: (step: SwapStep) => {
      if (step === SwapStep.WAITING_SIGNATURE) {
        setIsSwapModalOpen(true);
      }
    },
  });

  /* Initialize the sell token with the first token in the list */
  useEffect(() => {
    if (!isLoading && tokensList.length > 0 && !sellToken) {
      handleTokenSelect("sell")(tokensList[0]);
    }
  }, [isLoading, tokensList]);

  useEffect(() => {
    if (!typedValue || !sellToken || !buyToken) return;

    const payload: QuoteRequest = {
      assetIn: sellToken.contract,
      assetOut: buyToken.contract,
      amount: parseUnits({ value: typedValue }).toString(),
      tradeType:
        independentField === "sell" ? TradeType.EXACT_IN : TradeType.EXACT_OUT,
      protocols: swapSettings.protocols,
      parts: 10,
      slippageTolerance: (Number(swapSettings.customSlippage) * 100).toString(),
      assetList: ["soroswap"],
      maxHops: 2,
    };

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      setQuoteRequest(payload);
    }, 400);

    return () => {
      const t = debounceTimeoutRef.current;
      if (t) clearTimeout(t);
    };
  }, [typedValue, sellToken, buyToken, independentField, swapSettings]);

  const derivedSellAmount = useMemo(() => {
    if (!quote || independentField === "sell") return undefined;

    if (quote.tradeType === TradeType.EXACT_OUT) {
      // exact out -> expectedAmountIn is available
      const expected = (quote.trade as { expectedAmountIn?: bigint })
        .expectedAmountIn;
      return formatUnits({ value: expected?.toString() ?? "0" });
    }
    // fallback
    return undefined;
  }, [quote, independentField]);

  const derivedBuyAmount = useMemo(() => {
    if (!quote || independentField === "buy") return undefined;

    if (quote.tradeType === TradeType.EXACT_IN) {
      // exact in -> expectedAmountOut is available
      const expected = (quote.trade as { expectedAmountOut?: bigint })
        .expectedAmountOut;
      return formatUnits({ value: expected?.toString() ?? "0" });
    }
    return undefined;
  }, [quote, independentField]);

  const handleAmountChange = useCallback(
    (field: IndependentField) => (amount: string | undefined) => {
      dispatchSwap({ type: "TYPE_INPUT", field, typedValue: amount ?? "" });
      setQuoteRequest(null);
    },
    [],
  );

  const handleTokenSelect = useCallback(
    (field: IndependentField) => (token: TokenType | null) => {
      dispatchSwap({ type: "SET_TOKEN", field, token });
    },
    [],
  );

  const handleSwitchToken = useCallback(() => {
    setIsTokenSwitched((prev) => !prev);
    dispatchSwap({ type: "SWITCH_TOKENS" });
    setQuoteRequest(null);
  }, []);

  const handleSwap = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!quote || !userAddress) return;
    try {
      await executeSwap(quote, userAddress);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-2">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xl text-white sm:text-2xl">Swap</p>
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
            />

            <RotateArrowButton
              onClick={handleSwitchToken}
              className={cn(
                isTokenSwitched ? "rotate-180" : "rotate-0",
                "transition-transform duration-300",
              )}
              isLoading={isQuoteLoading}
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
          />

          <div className="flex flex-col gap-2">
            {!userAddress ? (
              <ConnectWallet className="flex w-full justify-center" />
            ) : (
              <TheButton
                disabled={
                  !sellToken ||
                  !buyToken ||
                  sellToken.contract === buyToken.contract
                }
                onClick={handleSwap}
                className="btn relative h-14 w-full rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80"
              >
                {!buyToken || !sellToken
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
