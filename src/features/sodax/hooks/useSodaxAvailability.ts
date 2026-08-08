"use client";

import useSWR from "swr";
import { SODA_STELLAR } from "@/features/sodax/constants/sodax";
import { fetchSodaxStellarTokens } from "@/features/sodax/lib/api";
import { isProductionEnv } from "@/shared/lib/environmentVars";

/**
 * Graceful-degradation gate for the whole SODAX feature.
 *
 * Requires mainnet (the solver has no testnet and the asset constants are
 * mainnet identities), a configured backend (SODAX_SWAPS_API_URL set), and
 * SODA actually listed by the live API. While loading or on any failure the
 * feature reports disabled, so the app behaves exactly as it does today —
 * SODA never enters the token selector and no SODAX code path runs.
 */
export function useSodaxAvailability() {
  const { data, error, isLoading } = useSWR(
    isProductionEnv ? "sodax-stellar-tokens" : null,
    fetchSodaxStellarTokens,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60 * 60 * 1000, // token listings change rarely
      errorRetryCount: 2,
      shouldRetryOnError: true,
    },
  );

  const isSodaxEnabled =
    isProductionEnv &&
    !error &&
    !!data?.some((token) => token.address === SODA_STELLAR.contract);

  return {
    isSodaxEnabled,
    isSodaxLoading: isLoading,
  };
}
