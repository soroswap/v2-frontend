/* eslint-disable react-hooks/exhaustive-deps */
import { useSwapSettingsStore } from "@/contexts/store/swap-settings";
import { useQuote } from "@/features/swap/hooks/useQuote";
import {
  SwapError,
  SwapResult,
  SwapStep,
  SwapModalState,
  useSwap,
} from "@/features/swap/hooks/useSwap";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { formatUnits, parseUnits } from "@/shared/lib/utils/parseUnits";
import { slippageBps } from "@/shared/lib/utils/slippageBps";
import {
  AssetInfo,
  QuoteRequest,
  SupportedAssetLists,
  TradeType,
} from "@soroswap/sdk";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

// -----------------------------------------------------------------------------
// Types & helper utilities
// -----------------------------------------------------------------------------
type IndependentField = "sell" | "buy";

interface SwapState {
  typedValue: string;
  independentField: IndependentField;
  sellToken: AssetInfo | null;
  buyToken: AssetInfo | null;
}

const initialSwapState: SwapState = {
  typedValue: "",
  independentField: "sell",
  sellToken: null,
  buyToken: null,
};

/**
 * All possible actions for the reducer that manages the swap form state.
 */
type SwapAction =
  | { type: "TYPE_INPUT"; field: IndependentField; typedValue: string }
  | { type: "SET_TOKEN"; field: IndependentField; token: AssetInfo | null }
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

// -----------------------------------------------------------------------------
// Hook definition
// -----------------------------------------------------------------------------
export interface UseSwapControllerProps {
  /**
   * (Optional) wallet address of the connected user. Required for actually
   * sending the transaction.
   */
  userAddress?: string;

  /**
   * Callbacks forwarded to the internal `useSwap` hook.
   */
  onSuccess?: (result: SwapResult) => void;
  onError?: (error: SwapError) => void;
  onStepChange?: <T extends SwapStep>(step: T, data?: SwapModalState) => void;
}

export function useSwapController({
  userAddress,
  onSuccess,
  onError,
  onStepChange,
}: UseSwapControllerProps) {
  // ---------------------------------------------------------------------------
  // External (global) state / data.
  // ---------------------------------------------------------------------------
  const { tokensList, isLoading: isTokensLoading } = useTokensList();
  const { swapSettings } = useSwapSettingsStore();

  // ---------------------------------------------------------------------------
  // Local component state.
  // ---------------------------------------------------------------------------
  const [swapState, dispatchSwap] = useReducer(swapReducer, initialSwapState);
  const { typedValue, independentField, sellToken, buyToken } = swapState;

  // debounce ref to avoid spamming the quote endpoint.
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Quote logic
  // ---------------------------------------------------------------------------
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const { quote, isLoading: isQuoteLoading } = useQuote(quoteRequest);

  // Build the quote request payload every time the user changes relevant data.
  useEffect(() => {
    if (
      !typedValue ||
      !sellToken ||
      !buyToken ||
      !sellToken.contract ||
      !buyToken.contract
    )
      return;

    const payload: QuoteRequest = {
      assetIn: sellToken.contract,
      assetOut: buyToken.contract,
      amount: parseUnits({ value: typedValue }),
      tradeType:
        independentField === "sell" ? TradeType.EXACT_IN : TradeType.EXACT_OUT,
      protocols: swapSettings.protocols,
      parts: 10,
      slippageBps: slippageBps(swapSettings.customSlippage),
      assetList: [SupportedAssetLists.SOROSWAP], // TODO: when user add an custom asset , So we  don't have the assset from the soroswap we need to disable this
      maxHops: 2,
    };

    // Debounce to avoid creating too many SWR keys / requests.
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      setQuoteRequest(payload);
    }, 400);

    return () => {
      const t = debounceTimeoutRef.current;
      if (t) clearTimeout(t);
    };
  }, [typedValue, sellToken, buyToken, independentField, swapSettings]);

  // ---------------------------------------------------------------------------
  // Derived amounts (sell / buy) depending on quote direction.
  // ---------------------------------------------------------------------------
  const derivedSellAmount = useMemo(() => {
    if (!quote || independentField === "sell") return undefined;

    if (quote.tradeType === TradeType.EXACT_OUT) {
      // exact out -> amountIn is available
      return formatUnits({ value: quote.amountIn?.toString() ?? "0" });
    }
    return undefined;
  }, [quote, independentField]);

  const derivedBuyAmount = useMemo(() => {
    if (!quote || independentField === "buy") return undefined;

    if (quote.tradeType === TradeType.EXACT_IN) {
      // exact in -> amountOut is available
      return formatUnits({ value: quote.amountOut?.toString() ?? "0" });
    }
    return undefined;
  }, [quote, independentField]);

  // ---------------------------------------------------------------------------
  // Swap (transaction) logic – delegated to the existing `useSwap` hook.
  // ---------------------------------------------------------------------------
  const {
    executeSwap,
    currentStep,
    isLoading: isSwapLoading,
    modalData,
    reset: resetSwap,
  } = useSwap({
    onSuccess,
    onError,
    onStepChange,
  });

  // ---------------------------------------------------------------------------
  // Public handlers exposed to the UI layer.
  // ---------------------------------------------------------------------------

  /**
   * Update amount the user typed in either the "sell" or "buy" input.
   */
  const handleAmountChange = useCallback(
    (field: IndependentField) => (amount: string | undefined) => {
      dispatchSwap({ type: "TYPE_INPUT", field, typedValue: amount ?? "" });
      setQuoteRequest(null); // reset SWR key so the quote is rebuilt.
    },
    [],
  );

  /**
   * Called when the user selects a token from the picker.
   */
  const handleTokenSelect = useCallback(
    (field: IndependentField) => (token: AssetInfo | null) => {
      dispatchSwap({ type: "SET_TOKEN", field, token });
    },
    [],
  );

  /**
   * Swap the selected sell / buy tokens.
   */
  const handleSwitchTokens = useCallback(() => {
    dispatchSwap({ type: "SWITCH_TOKENS" });
    setQuoteRequest(null);
  }, []);

  /**
   * Executes the swap transaction via the Soroswap SDK API.
   */
  const handleSwap = useCallback(async () => {
    if (!quote || !userAddress) return;
    try {
      await executeSwap(quote, userAddress);
    } catch (err) {
      console.error(err);
    }
  }, [executeSwap, quote, userAddress]);

  // ---------------------------------------------------------------------------
  // Effects: initialise default values once token list is fetched.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isTokensLoading && tokensList.length > 0 && !sellToken) {
      handleTokenSelect("sell")(tokensList[0]);
    }
  }, [isTokensLoading, tokensList]);

  // ---------------------------------------------------------------------------
  // Return – the public API of this hook.
  // ---------------------------------------------------------------------------
  return {
    // raw data / state
    tokensList,
    isTokensLoading,
    typedValue,
    independentField,
    sellToken,
    buyToken,

    // quote info
    quote,
    isQuoteLoading,
    derivedSellAmount,
    derivedBuyAmount,

    // swap info
    currentStep,
    isSwapLoading,
    modalData,

    // handlers
    handleAmountChange,
    handleTokenSelect,
    handleSwitchTokens,
    handleSwap,

    // misc
    resetSwap,
  } as const;
}
