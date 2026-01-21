"use client";

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
  const { price, isLoading: isLoadingPrice } = useTokenPrice(
    token?.contract ?? null,
  );

  return (
    <div className="mt-1 h-5 min-w-20 overflow-hidden text-sm text-[#A0A3C4]">
      {isLoading || isLoadingPrice || price === null ? (
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
