"use client";

import {
  SODA_STELLAR,
  StellarClassicAsset,
  USDC_STELLAR,
  XLM_STELLAR_CONTRACT,
} from "@/features/sodax/constants/sodax";
import { useSodaTrustline } from "@/features/sodax/hooks/useSodaTrustline";
import { useSodaxAvailability } from "@/features/sodax/hooks/useSodaxAvailability";
import { useSodaxQuote } from "@/features/sodax/hooks/useSodaxQuote";
import {
  SodaxSwapResult,
  useSodaxSwap,
} from "@/features/sodax/hooks/useSodaxSwap";
import { applySlippageToQuote, isSodaxPair } from "@/features/sodax/lib/pair";
import { SodaxApiError } from "@/features/sodax/types/sodax";
import { formatUnits, parseUnits } from "@/shared/lib/utils/parseUnits";
import { AssetInfo } from "@soroswap/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

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
 * Which classic asset the destination side needs a trustline for.
 * XLM is native — no trustline. Anything else on our pairs is SODA or USDC.
 */
function destinationTrustlineAsset(
  buyContract: string | undefined,
): StellarClassicAsset | null {
  if (!buyContract || buyContract === XLM_STELLAR_CONTRACT) return null;
  if (buyContract === SODA_STELLAR.contract) return SODA_STELLAR;
  if (buyContract === USDC_STELLAR.contract) return USDC_STELLAR;
  return null;
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

  // The executed amount comes from the debounced value; never allow a swap
  // while the two disagree, or a click inside the debounce window would
  // sign the previous amount.
  const isDebouncing = typedValue !== debouncedValue;

  const sellDecimals = sellToken?.decimals ?? 7;
  const buyDecimals = buyToken?.decimals ?? 7;

  const swap = useSodaxSwap({ onSuccess });

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
    // The intent commits to minOutputAmount before signing — refreshing the
    // quote during execution would only burn solver pathfinding.
    { paused: swap.isLoading },
  );

  const derivedBuyAmount = useMemo(() => {
    if (!isSodaxActive || !quote) return undefined;
    return formatUnits({ value: quote.quotedAmount, decimals: buyDecimals });
  }, [isSodaxActive, quote, buyDecimals]);

  const minOutputAmount = useMemo(() => {
    if (!quote) return null;
    return applySlippageToQuote(quote.quotedAmount, slippagePercent);
  }, [quote, slippagePercent]);

  // Button-ready copy for a failed quote. The solver rejects dust-sized
  // amounts with 422 "No path was found", which reads as a routing failure
  // but almost always means "amount too small" on these pairs.
  const quoteErrorMessage = useMemo(() => {
    if (!quoteError) return null;
    if (quoteError instanceof SodaxApiError) {
      if (quoteError.status === 422) {
        return "Amount too small — try a larger amount";
      }
      if (
        quoteError.code === "NETWORK_ERROR" ||
        quoteError.code === "TIMEOUT_ERROR"
      ) {
        return "Connection problem — retrying...";
      }
    }
    return "Quote unavailable right now";
  }, [quoteError]);

  // Destination trustline gate: the solver cannot deliver a classic asset
  // (SODA or USDC) without a trustline. Selling implies the source one exists.
  const trustlineAsset = useMemo(
    () =>
      isSodaxActive && userAddress
        ? destinationTrustlineAsset(buyToken?.contract)
        : null,
    [isSodaxActive, userAddress, buyToken?.contract],
  );
  const trustline = useSodaTrustline(trustlineAsset);
  const needsSodaTrustline =
    !!trustlineAsset &&
    trustline.hasCheckedOnce &&
    !trustline.trustlineStatus.exists;

  const handleSodaxSwap = useCallback(async () => {
    if (
      !isSodaxActive ||
      isDebouncing ||
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
      // The machine already captured the error into its ERROR state
      // (or the user cancelled, which is not an error).
      console.error("[SODAX] Swap failed:", error);
    } finally {
      // Whatever happened, the executed quote is stale now.
      mutate();
    }
  }, [
    isSodaxActive,
    isDebouncing,
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
    isDebouncing,
    sodaxQuote: quote,
    sodaxQuoteError: quoteError,
    sodaxQuoteErrorMessage: quoteErrorMessage,
    isSodaxQuoteLoading: isLoading,
    derivedBuyAmount,
    minOutputAmount,
    // trustline
    trustline,
    trustlineAsset,
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
