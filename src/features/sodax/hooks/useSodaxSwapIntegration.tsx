"use client";

import { formatUnits, parseUnits } from "@/shared/lib/utils/parseUnits";
import { AssetInfo } from "@soroswap/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SODA_STELLAR } from "../constants/sodax";
import { applySlippageToQuote, isSodaxPair } from "../lib/pair";
import { useSodaTrustline } from "./useSodaTrustline";
import { useSodaxAvailability } from "./useSodaxAvailability";
import { useSodaxQuote } from "./useSodaxQuote";
import { SodaxSwapResult, useSodaxSwap } from "./useSodaxSwap";

export interface UseSodaxSwapIntegrationParams {
  sellToken: AssetInfo | null;
  buyToken: AssetInfo | null;
  typedValue: string;
  independentField: "sell" | "buy";
  userAddress?: string;
  /** Human-readable slippage from swap settings (e.g. "0.5"). */
  slippagePercent: string | number;
  onSuccess?: (result: SodaxSwapResult) => void;
}

function toBaseUnits(value: string, decimals: number): string | null {
  if (!value || !/^\d*\.?\d+$/.test(value)) return null;
  try {
    const units = parseUnits({ value, decimals }).toString();
    return units === "0" ? null : units;
  } catch {
    return null;
  }
}

/**
 * Single attachment point between the SODAX feature and the existing swap UI.
 * The swap controller feeds its form state in; everything SODAX-specific
 * (routing decision, quote, trustline gate, execution machine) stays here.
 */
export function useSodaxSwapIntegration({
  sellToken,
  buyToken,
  typedValue,
  independentField,
  userAddress,
  slippagePercent,
  onSuccess,
}: UseSodaxSwapIntegrationParams) {
  const { isSodaxEnabled } = useSodaxAvailability();

  /** True when this pair must route through the SODAX solver. */
  const isSodaxActive =
    isSodaxEnabled && isSodaxPair(sellToken?.contract, buyToken?.contract);

  // Debounce the typed amount the same way the controller debounces its
  // quote request, so both providers feel identical while typing.
  const [debouncedValue, setDebouncedValue] = useState(typedValue);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(typedValue), 400);
    return () => clearTimeout(timer);
  }, [typedValue]);

  const sellDecimals = sellToken?.decimals ?? 7;
  const buyDecimals = buyToken?.decimals ?? 7;

  // SODAX only supports exact_input, so only the Sell side can drive.
  const inputAmount =
    isSodaxActive && independentField === "sell"
      ? toBaseUnits(debouncedValue, sellDecimals)
      : null;

  const { quote, quoteError, isLoading, mutate } = useSodaxQuote(
    isSodaxActive && inputAmount && sellToken?.contract && buyToken?.contract
      ? {
          tokenSrc: sellToken.contract,
          tokenDst: buyToken.contract,
          amount: inputAmount,
        }
      : null,
  );

  const derivedBuyAmount = useMemo(() => {
    if (!isSodaxActive || !quote) return undefined;
    return formatUnits({ value: quote.quotedAmount, decimals: buyDecimals });
  }, [isSodaxActive, quote, buyDecimals]);

  const minOutputAmount = useMemo(() => {
    if (!quote) return null;
    return applySlippageToQuote(quote.quotedAmount, slippagePercent);
  }, [quote, slippagePercent]);

  // Trustline gate: the solver cannot deliver SODA without a trustline, so
  // buying SODA is blocked until one exists. Selling implies one already does.
  const trustline = useSodaTrustline();
  const needsSodaTrustline =
    isSodaxActive &&
    buyToken?.contract === SODA_STELLAR.contract &&
    !!userAddress &&
    trustline.hasCheckedOnce &&
    !trustline.trustlineStatus.exists;

  const swap = useSodaxSwap({ onSuccess });

  const handleSodaxSwap = useCallback(async () => {
    if (
      !isSodaxActive ||
      !inputAmount ||
      !minOutputAmount ||
      !sellToken?.contract ||
      !buyToken?.contract ||
      !userAddress ||
      needsSodaTrustline
    ) {
      return;
    }

    try {
      await swap.executeSodaxSwap({
        inputToken: sellToken.contract,
        outputToken: buyToken.contract,
        inputAmount,
        minOutputAmount,
        userAddress,
      });
    } catch (error) {
      // The machine already captured the error into its ERROR state.
      console.error("[SODAX] Swap failed:", error);
    } finally {
      // Whatever happened, the executed quote is stale now.
      mutate();
    }
  }, [
    isSodaxActive,
    inputAmount,
    minOutputAmount,
    sellToken,
    buyToken,
    userAddress,
    needsSodaTrustline,
    swap,
    mutate,
  ]);

  return {
    isSodaxEnabled,
    isSodaxActive,
    // quote
    inputAmount,
    sodaxQuote: quote,
    sodaxQuoteError: quoteError,
    isSodaxQuoteLoading: isLoading,
    derivedBuyAmount,
    minOutputAmount,
    // trustline
    trustline,
    needsSodaTrustline,
    // execution
    handleSodaxSwap,
    sodaxStep: swap.currentStep,
    sodaxFillStatus: swap.fillStatus,
    sodaxError: swap.error,
    sodaxResult: swap.result,
    isSodaxSwapLoading: swap.isLoading,
    resetSodaxSwap: swap.reset,
  } as const;
}
