"use client";

import useSWR from "swr";
import {
  SODAX_COUNTERPART_CONTRACTS,
  USDC_STELLAR,
  getSodaxAsset,
} from "@/features/sodax/constants/sodax";
import { fetchSodaxUsdPrice } from "@/features/sodax/lib/api";
import { isProductionEnv } from "@/shared/lib/environmentVars";

/**
 * USD price for a SODAX registry asset, which Soroswap's price API does not
 * cover (it returns price: null). Fetched from the cached server route
 * (GET /api/sodax/price -> src/app/api/sodax/price/route.ts), which probes
 * the solver with a fixed 100 USDC -> asset quote and caches the result for
 * 120s server-side — the client no longer does that maths itself. Inert
 * (null, not loading) for any contract that isn't a registry asset, unless
 * `includeCounterparts` also admits XLM and USDC (USDC is 1 without a
 * request) — used to value the sell side of a SODAX pair from the same
 * source as the buy side.
 */
export interface UseSodaxUsdPriceOptions {
  /** Also price XLM and USDC (the non-registry legs of a SODAX pair). */
  includeCounterparts?: boolean;
  /** Set false to hold the request without changing the key shape. */
  enabled?: boolean;
}

export function useSodaxUsdPrice(
  contract: string | null,
  options?: UseSodaxUsdPriceOptions,
) {
  // Registry identities are mainnet-only, and the feature is inert off
  // mainnet — a pasted registry contract on testnet must not probe SODAX.
  const isPriceable =
    isProductionEnv &&
    (options?.enabled ?? true) &&
    !!contract &&
    (!!getSodaxAsset(contract) ||
      (!!options?.includeCounterparts &&
        SODAX_COUNTERPART_CONTRACTS.includes(contract)));

  const { data, error, isLoading } = useSWR(
    isPriceable ? ["sodax-usd-price", contract] : null,
    async ([, assetContract]: [string, string]) => {
      if (assetContract === USDC_STELLAR.contract) return 1;
      const { usdPrice } = await fetchSodaxUsdPrice(assetContract);
      return usdPrice;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 180_000,
      refreshInterval: 300_000,
      errorRetryCount: 2,
    },
  );

  return {
    price: isPriceable ? (data ?? null) : null,
    isLoading: isPriceable && isLoading,
    // True once the retries above are exhausted and no price could be
    // resolved, so a caller can tell "still trying" apart from "gave up".
    isError: isPriceable && !!error,
  };
}
