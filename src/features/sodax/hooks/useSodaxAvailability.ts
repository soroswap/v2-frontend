"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
  SODAX_STELLAR_ASSETS,
  SodaxStellarAsset,
} from "@/features/sodax/constants/sodax";
import { fetchSodaxStellarTokens } from "@/features/sodax/lib/api";
import { isProductionEnv } from "@/shared/lib/environmentVars";

/**
 * Graceful-degradation gate for the whole SODAX feature.
 *
 * Requires mainnet (the solver has no testnet and the asset constants are
 * mainnet identities), a configured backend (SODAX_SWAPS_API_URL set), and a
 * non-empty live token list. While loading or on any failure the feature
 * reports disabled, so the app behaves exactly as it does today — no SODAX
 * asset enters the token selector and no SODAX code path runs.
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

  const isSodaxEnabled = isProductionEnv && !error && !!data && data.length > 0;

  // Registry assets currently listed live, in registry order, so a delisted
  // asset disappears from the selector automatically instead of failing to
  // quote after the user has already picked it.
  const availableAssets = useMemo<readonly SodaxStellarAsset[]>(() => {
    if (!isSodaxEnabled || !data) return [];
    const liveContracts = new Set(data.map((token) => token.address));
    return SODAX_STELLAR_ASSETS.filter((asset) =>
      liveContracts.has(asset.contract),
    );
  }, [isSodaxEnabled, data]);

  return {
    isSodaxEnabled,
    isSodaxLoading: isLoading,
    availableAssets,
  };
}
