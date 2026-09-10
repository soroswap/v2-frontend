"use client";

import useSWR from "swr";
import { getSodaxAsset } from "@/features/sodax/constants/sodax";
import { fetchSodaxUsdPrice } from "@/features/sodax/lib/api";
import { isProductionEnv } from "@/shared/lib/environmentVars";

/**
 * USD price for a SODAX registry asset, which Soroswap's price API does not
 * cover (it returns price: null). Fetched from the cached server route
 * (GET /api/sodax/price -> src/app/api/sodax/price/route.ts), which probes
 * the solver with a fixed 100 USDC -> asset quote and caches the result for
 * 120s server-side — the client no longer does that maths itself. Inert
 * (null, not loading) for any contract that isn't a registry asset.
 */
export function useSodaxUsdPrice(contract: string | null) {
  // Registry identities are mainnet-only, and the feature is inert off
  // mainnet — a pasted registry contract on testnet must not probe SODAX.
  const asset = isProductionEnv ? getSodaxAsset(contract) : undefined;

  const { data, error, isLoading } = useSWR(
    asset ? ["sodax-usd-price", contract] : null,
    async ([, assetContract]: [string, string]) => {
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
    price: asset ? (data ?? null) : null,
    isLoading: !!asset && isLoading,
    // True once the retries above are exhausted and no price could be
    // resolved, so a caller can tell "still trying" apart from "gave up".
    isError: !!asset && !!error,
  };
}
