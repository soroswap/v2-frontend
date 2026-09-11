"use client";

import {
  SODAX_MIN_RWA_SWAP_USD,
  StellarClassicAsset,
  USDC_STELLAR,
  XLM_STELLAR_CONTRACT,
  getSodaxAsset,
  isRwaAsset,
} from "@/features/sodax/constants/sodax";
import { useSodaxAvailability } from "@/features/sodax/hooks/useSodaxAvailability";
import { useSodaxUsdPrice } from "@/features/sodax/hooks/useSodaxUsdPrice";
import { useSodaxQuote } from "@/features/sodax/hooks/useSodaxQuote";
import {
  SodaxSwapResult,
  useSodaxSwap,
} from "@/features/sodax/hooks/useSodaxSwap";
import { useSodaxTrustline } from "@/features/sodax/hooks/useSodaxTrustline";
import { applySlippageToQuote, isSodaxPair } from "@/features/sodax/lib/pair";
import { SodaxApiError } from "@/features/sodax/types/sodax";
import { formatUnits, parseUnits } from "@/shared/lib/utils/parseUnits";
import { AssetInfo } from "@soroswap/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Snapshot of what was actually submitted, for the completion screen. */
export interface SodaxRunSummary {
  sellToken: AssetInfo | null;
  buyToken: AssetInfo | null;
  /** Human-readable sell amount, e.g. "10". */
  sellAmount: string;
  /** Human-readable buy amount at quote time, e.g. "0.4474451". */
  buyAmount: string | undefined;
}

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
 * XLM is native — no trustline. Anything else on our pairs is a SODAX
 * registry asset or USDC.
 */
function destinationTrustlineAsset(
  buyContract: string | undefined,
): StellarClassicAsset | null {
  if (!buyContract || buyContract === XLM_STELLAR_CONTRACT) return null;
  const registryAsset = getSodaxAsset(buyContract);
  if (registryAsset) return registryAsset;
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

  // Minimum size for tokenized stocks/ETFs. The solver rejects anything
  // below about $2 with the same 422 "No path" it uses for a missing route,
  // so value the sell side up front (from the SODAX price route, the same
  // source as the buy side — never from the AMM price feed) and stop before
  // quoting. Unknown price => no gate; the 422 copy below still says why.
  const involvesRwa =
    isRwaAsset(getSodaxAsset(sellToken?.contract)) ||
    isRwaAsset(getSodaxAsset(buyToken?.contract));
  const { price: sellUsdPrice } = useSodaxUsdPrice(
    sellToken?.contract ?? null,
    { includeCounterparts: true, enabled: isSodaxActive && involvesRwa },
  );
  const sellNotionalUsd = useMemo(() => {
    if (!involvesRwa || sellUsdPrice === null) return null;
    const amount = Number(debouncedValue);
    return Number.isFinite(amount) && amount > 0 ? amount * sellUsdPrice : null;
  }, [involvesRwa, sellUsdPrice, debouncedValue]);
  const isBelowMinimum =
    isSodaxActive &&
    sellNotionalUsd !== null &&
    sellNotionalUsd < SODAX_MIN_RWA_SWAP_USD;

  // SODAX only supports exact_input, so only the Sell side can drive. Also
  // null while the amount is under the minimum, which both skips the quote
  // and blocks execution.
  const inputAmount =
    isSodaxActive && independentField === "sell" && !isBelowMinimum
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

  // True for the known sell-direction gap: selling a registry asset other
  // than SODA has no route on the solver yet, regardless of amount — "try a
  // larger amount" is actively wrong advice for this case.
  const isNonSodaSellGap = useMemo(() => {
    const sellAsset = getSodaxAsset(sellToken?.contract);
    return !!sellAsset && sellAsset.code !== "SODA";
  }, [sellToken?.contract]);

  // Button-ready status copy: the minimum gate first (no quote is issued),
  // then a failed quote. The solver returns 422 "No path was found" both for
  // amounts under the minimum and for the sell-direction gap above (see
  // sodaxQuoteErrorHint below for the explanatory hint).
  const quoteErrorMessage = useMemo(() => {
    if (isBelowMinimum) {
      return `Minimum for stock swaps is about $${SODAX_MIN_RWA_SWAP_USD}`;
    }
    if (!quoteError) return null;
    if (quoteError instanceof SodaxApiError) {
      if (quoteError.status === 422) {
        if (isNonSodaSellGap) return "No route for this direction yet";
        return involvesRwa
          ? `No route found — stock swaps need about $${SODAX_MIN_RWA_SWAP_USD} or more`
          : "No route found — try a larger amount";
      }
      if (
        quoteError.code === "NETWORK_ERROR" ||
        quoteError.code === "TIMEOUT_ERROR"
      ) {
        return "Connection problem — retrying...";
      }
    }
    return "Quote unavailable right now";
  }, [isBelowMinimum, quoteError, isNonSodaSellGap, involvesRwa]);

  // Explanatory line under the panels: the minimum (shown even before a
  // wallet is connected, unlike the button copy), or the known
  // sell-direction gap, which a bare "no route" message doesn't explain.
  const sodaxQuoteErrorHint = useMemo(() => {
    if (isBelowMinimum) {
      return `Swaps into or out of tokenized stocks and ETFs need about $${SODAX_MIN_RWA_SWAP_USD} or more.`;
    }
    if (!(quoteError instanceof SodaxApiError) || quoteError.status !== 422) {
      return null;
    }
    if (!isNonSodaSellGap) return null;
    const sellAsset = getSodaxAsset(sellToken?.contract);
    return `The SODAX solver couldn't find a route to sell ${sellAsset?.code} right now — this direction may not be available yet.`;
  }, [isBelowMinimum, quoteError, isNonSodaSellGap, sellToken?.contract]);

  // Destination trustline gate: the solver cannot deliver a classic asset
  // (a SODAX asset or USDC) without a trustline. Selling implies the source
  // one exists.
  const trustlineAsset = useMemo(
    () =>
      isSodaxActive && userAddress
        ? destinationTrustlineAsset(buyToken?.contract)
        : null,
    [isSodaxActive, userAddress, buyToken?.contract],
  );
  const trustline = useSodaxTrustline(trustlineAsset);
  const needsTrustline =
    !!trustlineAsset &&
    trustline.hasCheckedOnce &&
    !trustline.trustlineStatus.exists;
  // A destination trustline check is required but has not resolved yet —
  // needsTrustline stays false during that window (hasCheckedOnce is
  // false), so it alone cannot gate the swap; block separately.
  const isTrustlineCheckPending = !!trustlineAsset && !trustline.hasCheckedOnce;

  // What was actually submitted, snapshotted at the start of the run so the
  // completion screen can't drift onto whatever the form shows later — the
  // user is free to change tokens/amount or Dismiss and keep editing while
  // WAITING_FOR_FILL runs in the background.
  const [sodaxRunSummary, setSodaxRunSummary] =
    useState<SodaxRunSummary | null>(null);

  const handleSodaxSwap = useCallback(async () => {
    if (
      !isSodaxActive ||
      isDebouncing ||
      !inputAmount ||
      !minOutputAmount ||
      !sellToken?.contract ||
      !buyToken?.contract ||
      !userAddress ||
      needsTrustline ||
      isTrustlineCheckPending
    ) {
      return;
    }

    setSodaxRunSummary({
      sellToken,
      buyToken,
      sellAmount: formatUnits({ value: inputAmount, decimals: sellDecimals }),
      buyAmount: derivedBuyAmount,
    });

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
    needsTrustline,
    isTrustlineCheckPending,
    sellDecimals,
    derivedBuyAmount,
    swap,
    mutate,
  ]);

  // Dismiss/Close/Try Again all funnel through this — the snapshot belongs to
  // one run and must not leak into the next.
  const resetSodaxSwap = useCallback(() => {
    swap.reset();
    setSodaxRunSummary(null);
  }, [swap]);

  return {
    isSodaxEnabled,
    isSodaxActive,
    // quote
    inputAmount,
    isDebouncing,
    sodaxQuote: quote,
    sodaxQuoteError: quoteError,
    sodaxQuoteErrorMessage: quoteErrorMessage,
    sodaxQuoteErrorHint,
    // minimum size (tokenized stocks/ETFs only)
    isBelowMinimum,
    sellNotionalUsd,
    isSodaxQuoteLoading: isLoading,
    derivedBuyAmount,
    minOutputAmount,
    // trustline
    trustline,
    trustlineAsset,
    needsTrustline,
    isTrustlineCheckPending,
    // execution
    handleSodaxSwap,
    sodaxStep: swap.currentStep,
    sodaxFillStatus: swap.fillStatus,
    sodaxError: swap.error,
    sodaxResult: swap.result,
    sodaxRunSummary,
    isSodaxSwapLoading: swap.isLoading,
    resetSodaxSwap,
  } as const;
}
