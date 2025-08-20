"use client";

import { TheButton } from "@/shared/components";

export const PortfolioCard = () => {
  return (
    <div className="bg-surface border-surface-alt flex size-full flex-col justify-between gap-2 rounded-xl border p-4">
      <h2 className="text-primary text-xl font-bold">Portfolio</h2>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex w-full gap-4">
          <div className="flex w-full flex-col sm:w-fit">
            <p className="text-secondary text-sm">Deposits</p>
            <p className="text-primary text-lg font-semibold">$0.00</p>
          </div>
          <div className="flex w-full flex-col sm:w-fit">
            <p className="text-secondary text-sm">Earnings</p>
            <p className="text-primary text-lg font-semibold">$0.00</p>
          </div>
          <div className="flex w-full flex-col sm:w-fit">
            <p className="text-secondary text-sm">Realized APY</p>
            <p className="text-primary text-lg font-semibold">$0.00</p>
          </div>
        </div>
      </div>
    </div>
  );
};
