/* eslint-disable react-hooks/exhaustive-deps */
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

export interface Swap {
  amount: string | undefined;
  token: TokenType | null;
  tradeType: TradeType;
}

interface SwapState {
  sell: Swap;
  buy: Swap;
}

const initialSwapState: SwapState = {
  sell: { amount: undefined, token: null, tradeType: TradeType.EXACT_IN },
  buy: { amount: undefined, token: null, tradeType: TradeType.EXACT_OUT },
};

type SwapAction =
  | { type: "SET_SELL_AMOUNT"; amount: string | undefined }
  | { type: "SET_BUY_AMOUNT"; amount: string | undefined }
  | { type: "SET_SELL_TOKEN"; token: TokenType | null }
  | { type: "SET_BUY_TOKEN"; token: TokenType | null }
  | { type: "SWITCH_TOKENS"; payload?: { isTokenSwitched: boolean } };

type QuoteRequestAction = { type: "SET"; payload: QuoteRequest | null };

function quoteRequestReducer(
  _state: QuoteRequest | null,
  action: QuoteRequestAction,
): QuoteRequest | null {
  switch (action.type) {
    case "SET":
      return action.payload;
    default:
      return _state;
  }
}

//TODO: Add integrated tests to check if the  swap is working as expected.
export default function SwapPage() {
  const { address: userAddress } = useUserContext();
  const { tokensList, isLoading } = useTokensList();
  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { swapSettings } = useSwapSettingsStore();
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);

  /* Swap (sell/buy) state handled by reducer */
  const [swapState, dispatchSwap] = useReducer(swapReducer, initialSwapState);
  const { sell, buy } = swapState;

  /* Quote request state handled by reducer */
  const [quoteRequest, dispatchQuoteRequest] = useReducer(
    quoteRequestReducer,
    null,
  );

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

  function swapReducer(state: SwapState, action: SwapAction): SwapState {
    switch (action.type) {
      case "SET_SELL_AMOUNT":
        return {
          ...state,
          sell: {
            ...state.sell,
            amount: action.amount,
            tradeType: TradeType.EXACT_IN,
          },
        };
      case "SET_BUY_AMOUNT":
        return {
          ...state,
          buy: {
            ...state.buy,
            amount: action.amount,
            tradeType: TradeType.EXACT_OUT,
          },
        };
      case "SET_SELL_TOKEN":
        return { ...state, sell: { ...state.sell, token: action.token } };
      case "SET_BUY_TOKEN":
        return { ...state, buy: { ...state.buy, token: action.token } };
      case "SWITCH_TOKENS":
        console.log("SWITCH_TOKENS", state);
        if (isTokenSwitched) {
          // TODO: Check the behavior of swapping the tokens in initial state.
          const switchedState = {
            sell: {
              amount: state.buy.amount,
              token: state.buy.token,
              tradeType: TradeType.EXACT_IN,
            },
            buy: {
              amount: undefined,
              token: state.sell.token,
              tradeType: TradeType.EXACT_OUT,
            },
          } as const;
          console.log("newState IsTokenSwitched", switchedState);
          return switchedState;
        } else if (!isTokenSwitched) {
          const switchedState = {
            sell: {
              amount: undefined,
              token: state.buy.token,
              tradeType: TradeType.EXACT_IN,
            },
            buy: {
              amount: state.sell.amount,
              token: state.sell.token,
              tradeType: TradeType.EXACT_OUT,
            },
          } as const;
          console.log("newState IsTokenNotSwitched", switchedState);
          return switchedState;
        }
      default:
        return state;
    }
  }

  /* Initialize the sell token with the first token in the list */
  useEffect(() => {
    if (!isLoading && tokensList.length > 0 && !sell.token) {
      handleSelectSellToken(tokensList[0]);
    }
  }, [isLoading, tokensList]);

  /* Update the token amount when the quote is received */
  useEffect(() => {
    if (quote && quote.tradeType === TradeType.EXACT_IN) {
      console.log("EXACT_IN", quote);
      dispatchSwap({
        type: "SET_BUY_AMOUNT",
        amount:
          sell.amount && Number(sell.amount) > 0
            ? formatUnits({
                value: quote.trade.expectedAmountOut?.toString() ?? "0",
              }).toString()
            : "0",
      });
    } else if (quote && quote.tradeType === TradeType.EXACT_OUT) {
      console.log("EXACT_OUT", quote);
      dispatchSwap({
        type: "SET_SELL_AMOUNT",
        amount:
          buy.amount && Number(buy.amount) > 0
            ? formatUnits({
                value: quote.trade.expectedAmountIn?.toString() ?? "0",
              }).toString()
            : "0",
      });
    }
  }, [quote]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      console.log("isTokenSwitched", isTokenSwitched);
      // -----------------------------------------------------------------
      //  Determine which side has user-input and request the appropriate
      //  quote. We only send a request when **exactly one** side has an
      //  amount value. This prevents duplicate requests when we program-
      //  matically fill the opposite side after receiving a quote.
      // -----------------------------------------------------------------

      const sellAmt = sell.amount;
      const buyAmt = buy.amount;

      const hasSell = sellAmt !== undefined && Number(sellAmt) > 0;
      const hasBuy = buyAmt !== undefined && Number(buyAmt) > 0;

      if (hasSell && !hasBuy && sell.token && buy.token) {
        dispatchQuoteRequest({
          type: "SET",
          payload: {
            assetIn: sell.token.contract,
            assetOut: buy.token.contract,
            amount: parseUnits({ value: sellAmt!.toString() }).toString(),
            tradeType: TradeType.EXACT_IN,
            protocols: swapSettings.protocols,
            parts: 10,
            slippageTolerance: (
              Number(swapSettings.customSlippage) * 100
            ).toString(),
            assetList: ["soroswap"],
            maxHops: 2,
          },
        });
      } else if (hasBuy && !hasSell && buy.token && sell.token) {
        dispatchQuoteRequest({
          type: "SET",
          payload: {
            assetIn: sell.token.contract,
            assetOut: buy.token.contract,
            amount: parseUnits({ value: buyAmt!.toString() }).toString(),
            tradeType: TradeType.EXACT_OUT,
            protocols: swapSettings.protocols,
            parts: 10,
            slippageTolerance: (
              Number(swapSettings.customSlippage) * 100
            ).toString(),
            assetList: ["soroswap"],
            maxHops: 2,
          },
        });
      }
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [buy, sell, swapSettings]);

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
    const newSwitched = !isTokenSwitched;
    setIsTokenSwitched(newSwitched);
    dispatchSwap({
      type: "SWITCH_TOKENS",
      payload: { isTokenSwitched: newSwitched },
    });
  }, [dispatchSwap, isTokenSwitched]);

  const handleSellAmountChange = useCallback((amount: string | undefined) => {
    console.log("sell amount", amount);
    // Update SELL side
    dispatchSwap({ type: "SET_SELL_AMOUNT", amount });

    // Always clear the BUY side so we don't display stale data; a new quote
    // will repopulate it shortly.
    dispatchSwap({ type: "SET_BUY_AMOUNT", amount: undefined });
  }, []);

  const handleBuyAmountChange = useCallback((amount: string | undefined) => {
    // Update BUY side
    dispatchSwap({ type: "SET_BUY_AMOUNT", amount });

    // Clear SELL side for the same reason as above.
    dispatchSwap({ type: "SET_SELL_AMOUNT", amount: undefined });
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

  const handleSelectSellToken = useCallback(
    (token: TokenType | null) => {
      if (!token) return;
      // If same as current sell token, ignore
      if (sell.token && token.contract === sell.token.contract) return;

      // If selecting the token already on buy side -> switch
      if (buy.token && token.contract === buy.token.contract) {
        dispatchSwap({ type: "SWITCH_TOKENS" });
        console.log("HandleSelectSellToken Entering here", swapState);
        return;
      }

      dispatchSwap({ type: "SET_SELL_TOKEN", token });
    },
    [buy.token, sell.token],
  );

  const handleSelectBuyToken = useCallback(
    (token: TokenType | null) => {
      if (!token) return;
      if (buy.token && token.contract === buy.token.contract) return;

      if (sell.token && token.contract === sell.token.contract) {
        dispatchSwap({ type: "SWITCH_TOKENS" });
        console.log("HandleSelectBuyToken Entering here", swapState);
        return;
      }

      dispatchSwap({ type: "SET_BUY_TOKEN", token });
    },
    [sell.token, buy.token],
  );

  return (
    <main className="flex min-h-screen items-center justify-center p-2">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xl text-white sm:text-2xl">Swap</p>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
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
              onSelectToken={handleSelectSellToken}
              isLoading={isQuoteLoading}
              currentToken={sell.token}
              oppositeToken={buy.token}
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
              variant="outline"
              onSelectToken={handleSelectBuyToken}
              isLoading={isQuoteLoading}
              currentToken={buy.token}
              oppositeToken={sell.token}
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
                disabled={
                  !buy.token ||
                  !sell.token ||
                  sell.token?.contract === buy.token?.contract
                }
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
