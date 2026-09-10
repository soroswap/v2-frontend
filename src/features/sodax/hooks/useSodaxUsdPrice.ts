"use client";

import useSWR from "swr";
import {
  SODAX_STELLAR_CHAIN_KEY,
  USDC_STELLAR,
  getSodaxAsset,
} from "@/features/sodax/constants/sodax";
import { fetchSodaxQuote } from "@/features/sodax/lib/api";
import { formatUnits } from "@/shared/lib/utils/parseUnits";

/**
 * Amount used to probe the solver for a price, in USDC. The solver rejects
 * dust-sized quotes (a 1 USDC probe can return 422 "No path was found" on
 * some pairs), so probe with 100 USDC and divide.
 *
 * The probe direction is fixed as USDC -> asset, not asset -> USDC: selling
 * a registry asset other than SODA currently has no route (see lib/pair.ts),
 * so quoting the sell side would just fail for every stock/ETF/crypto entry.
 */
const PROBE_USDC = 100;

/**
 * USD price for a SODAX registry asset, which Soroswap's price API does not
 * cover (it returns price: null). Derived from the SODAX solver itself by
 * quoting USDC → asset on Stellar — net of solver fees, so a slightly
 * conservative display estimate. Inert (null, not loading) for any contract
 * that isn't a registry asset.
 */
export function useSodaxUsdPrice(contract: string | null) {
  const asset = getSodaxAsset(contract);

  const { data, error, isLoading } = useSWR(
    asset ? ["sodax-usd-price", contract] : null,
    async ([, assetContract]: [string, string]) => {
      const target = getSodaxAsset(assetContract);
      if (!target) return null;

      const { quotedAmount } = await fetchSodaxQuote({
        tokenSrc: USDC_STELLAR.contract,
        tokenSrcChainKey: SODAX_STELLAR_CHAIN_KEY,
        tokenDst: target.contract,
        tokenDstChainKey: SODAX_STELLAR_CHAIN_KEY,
        amount: (
          BigInt(PROBE_USDC) *
          BigInt(10) ** BigInt(USDC_STELLAR.decimals)
        ).toString(),
        quoteType: "exact_input",
      });

      if (BigInt(quotedAmount) === BigInt(0)) return null;

      return (
        PROBE_USDC /
        Number(formatUnits({ value: quotedAmount, decimals: target.decimals }))
      );
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
