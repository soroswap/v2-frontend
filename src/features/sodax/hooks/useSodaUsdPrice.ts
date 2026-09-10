"use client";

import {
  SODA_STELLAR,
  SODAX_STELLAR_CHAIN_KEY,
  USDC_STELLAR,
} from "@/features/sodax/constants/sodax";
import { fetchSodaxQuote } from "@/features/sodax/lib/api";
import { formatUnits } from "@/shared/lib/utils/parseUnits";
import useSWR from "swr";

/**
 * Amount used to probe the solver for a price. The solver rejects dust-sized
 * quotes (1 SODA returns 422 "No path was found"), so probe with 100 SODA
 * and divide.
 */
const PROBE_SODA = 100;

/**
 * USD price for SODA, which Soroswap's price API does not cover
 * (it returns price: null). Derived from the SODAX solver itself by quoting
 * SODA → USDC on Stellar — net of solver fees, so a slightly conservative
 * display estimate. Inert (null, not loading) for any other contract.
 */
export function useSodaUsdPrice(contract: string | null) {
  const isSoda = contract === SODA_STELLAR.contract;

  const { data, isLoading } = useSWR(
    isSoda ? "soda-usd-price" : null,
    async () => {
      const { quotedAmount } = await fetchSodaxQuote({
        tokenSrc: SODA_STELLAR.contract,
        tokenSrcChainKey: SODAX_STELLAR_CHAIN_KEY,
        tokenDst: USDC_STELLAR.contract,
        tokenDstChainKey: SODAX_STELLAR_CHAIN_KEY,
        amount: (
          BigInt(PROBE_SODA) *
          BigInt(10) ** BigInt(SODA_STELLAR.decimals)
        ).toString(),
        quoteType: "exact_input",
      });
      return (
        Number(
          formatUnits({ value: quotedAmount, decimals: USDC_STELLAR.decimals }),
        ) / PROBE_SODA
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
    price: isSoda ? (data ?? null) : null,
    isLoading: isSoda && isLoading,
  };
}
