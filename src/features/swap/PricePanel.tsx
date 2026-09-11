"use client";

import { useSodaxUsdPrice } from "@/features/sodax";
import { getSodaxAsset } from "@/features/sodax/constants/sodax";
import { useTokenPrice } from "@/features/swap/hooks/useTokenPrice";
import { AssetInfo } from "@soroswap/sdk";

export const PricePanel = ({
  isLoading,
  token,
  amount,
}: {
  isLoading: boolean;
  token: AssetInfo | null | undefined;
  amount: string | undefined;
}) => {
  const { price: soroswapPrice, isLoading: isLoadingPrice } = useTokenPrice(
    token?.contract ?? null,
  );
  // The Soroswap price API has no prices for SODAX assets (returns null);
  // the SODAX solver quote fills that gap. Inert for every other token.
  // isError isn't branched on directly below — price staying null once
  // fetching has settled already covers the "fallback failed" case, but
  // the hook exposes it so a settled-with-no-price state is distinguishable
  // from "no price API covers this token" for any future caller.
  const { price: sodaxPrice, isLoading: isLoadingSodaxPrice } =
    useSodaxUsdPrice(token?.contract ?? null);
  const price = soroswapPrice ?? sodaxPrice;

  // Still actively fetching — show the skeleton. Once settled, price===null
  // means no price could be resolved (including the SODAX fallback having
  // exhausted its retries). For a SODAX registry asset that is a genuine
  // "no price available" and shows "—"; for every other token this must stay
  // byte-for-byte the pre-SODAX behaviour (skeleton forever while settled at
  // null), since e.g. buyToken === null on first load of "/" and any pool
  // token /api/price has no price for hits this same branch.
  const isFetching = isLoading || isLoadingPrice || isLoadingSodaxPrice;
  const isPriceUnavailable =
    !isFetching && price === null && !!getSodaxAsset(token?.contract);

  return (
    <div className="mt-1 h-5 min-w-20 overflow-hidden text-sm text-[#A0A3C4]">
      {isFetching ? (
        <div className="skeleton h-full w-20" />
      ) : isPriceUnavailable ? (
        <span className="flex h-full items-center">—</span>
      ) : (
        <span className="flex h-full items-center">
          {amount == "."
            ? "$0.00"
            : `$${new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(Number(price) * Number(amount || 0))}`}
        </span>
      )}
    </div>
  );
};
