"use client";

export const BridgePricePanel = ({
  amount,
}: {
  amount: string | undefined;
}) => {
  return (
    <div className="mt-1 h-5 min-w-20 overflow-hidden text-base text-[#A0A3C4] sm:text-lg">
      <span className="flex h-full items-center">
        {amount == "." || !amount
          ? "$0.00"
          : `$${new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Number(amount || 0))}`}
      </span>
    </div>
  );
};


