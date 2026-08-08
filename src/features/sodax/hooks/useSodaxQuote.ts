"use client";

import useSWR from "swr";
import { SODAX_STELLAR_CHAIN_KEY } from "@/features/sodax/constants/sodax";
import { fetchSodaxQuote } from "@/features/sodax/lib/api";
import { SodaxQuoteRequest } from "@/features/sodax/types/sodax";

export interface UseSodaxQuoteParams {
  /** Source token contract on Stellar. */
  tokenSrc: string;
  /** Destination token contract on Stellar. */
  tokenDst: string;
  /** Input amount in smallest unit of the source token. */
  amount: string;
}

export interface UseSodaxQuoteOptions {
  /** Pause the periodic refresh (e.g. while a swap is executing). */
  paused?: boolean;
}

/**
 * Solver quote for a SODA pair. Pass null to disable (wrong pair, empty
 * amount, feature off). Mirrors useQuote's SWR configuration, with a shorter
 * refresh so a displayed price can't go stale while the user hesitates.
 */
export function useSodaxQuote(
  params: UseSodaxQuoteParams | null,
  options?: UseSodaxQuoteOptions,
) {
  const quoteRequest: SodaxQuoteRequest | null =
    params && BigInt(params.amount || "0") > BigInt(0)
      ? {
          tokenSrc: params.tokenSrc,
          tokenSrcChainKey: SODAX_STELLAR_CHAIN_KEY,
          tokenDst: params.tokenDst,
          tokenDstChainKey: SODAX_STELLAR_CHAIN_KEY,
          amount: params.amount,
          quoteType: "exact_input",
        }
      : null;

  const { data, error, isLoading, mutate } = useSWR(
    quoteRequest ? ["/api/sodax/quote", quoteRequest] : null,
    ([, request]) => fetchSodaxQuote(request),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10_000,
      refreshInterval: options?.paused ? 0 : 30_000,
      errorRetryCount: 3,
      errorRetryInterval: 1_000,
    },
  );

  return {
    quote: data,
    quoteError: error,
    isLoading,
    mutate,
  };
}
