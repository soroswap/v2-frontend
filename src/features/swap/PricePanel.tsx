"use client";

import { useTokenPrice } from "@/features/swap/hooks/useTokenPrice";
import { TokenType } from "@/features/swap/types";

export const PricePanel = ({
  isLoading,
  token,
  amount,
}: {
  isLoading: boolean;
  token: TokenType | null | undefined;
  amount: string | undefined;
}) => {
  const { price, isLoading: isLoadingPrice } = useTokenPrice(
    token?.contract ?? null,
  );

  return (
    <div className="mt-1 h-5 min-w-20 overflow-hidden text-base text-[#A0A3C4] sm:text-lg">
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
