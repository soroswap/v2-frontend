"use client";

import useSWR from "swr";
import { SODA_STELLAR } from "../constants/sodax";
import { fetchSodaxStellarTokens } from "../lib/api";

/**
 * Graceful-degradation gate for the whole SODAX feature.
 *
 * Confirms the backend is configured (SODAX_SWAPS_API_URL set) and that SODA
 * is actually listed by the live API. While loading or on any failure the
 * feature reports disabled, so the app behaves exactly as it does today —
 * SODA never enters the token selector and no SODAX code path runs.
 */
export function useSodaxAvailability() {
  const { data, error, isLoading } = useSWR(
    "sodax-stellar-tokens",
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
    !error &&
    !!data?.some((token) => token.address === SODA_STELLAR.contract);

  return {
    isSodaxEnabled,
    sodaxTokens: data,
    isSodaxLoading: isLoading,
  };
}
