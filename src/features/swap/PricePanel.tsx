"use client";

import { useSodaUsdPrice } from "@/features/sodax";
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
  // The Soroswap price API has no SODA price (returns null); the SODAX
  // solver quote fills that gap. Inert for every other token.
  const { price: sodaPrice, isLoading: isLoadingSodaPrice } = useSodaUsdPrice(
    token?.contract ?? null,
  );
  const price = soroswapPrice ?? sodaPrice;

  return (
    <div className="mt-1 h-5 min-w-20 overflow-hidden text-sm text-[#A0A3C4]">
      {isLoading || isLoadingPrice || isLoadingSodaPrice || price === null ? (
        <div className="skeleton h-full w-20" />
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
