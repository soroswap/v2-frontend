"use client";

import Link from "next/link";
import { UserLiquidity } from "@/features/pools/components/UserLiquidity";
import { SoroSwapAllLiquidityPools } from "@/features/pools/components/SoroSwapAllLiquidityPools";
import { PlusIcon } from "lucide-react";
import { xlmTokenList } from "@/shared/lib/constants/tokenList";

export default function PoolsPage() {
  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center px-4 py-10 md:px-1">
      <div className="bg-surface flex w-full max-w-7xl flex-col rounded-2xl border border-[#8866DD] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-primary text-xl sm:text-2xl">Pools</span>

          {/* "Add Liquidity" CTA – collapses to short label on very small screens */}
          <Link
            href={`/pools/add-liquidity/${xlmTokenList[0].assets[0].contract}/`}
            className="bg-brand/20 hover:bg-brand/30 text-brand inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
          >
            <span className="text-lg leading-none">
              <PlusIcon />
            </span>
            <span className="xs:inline hidden">Add&nbsp;Liquidity</span>
            <span className="xs:hidden">Add</span>
          </Link>
        </div>

        <UserLiquidity />

        <SoroSwapAllLiquidityPools />
      </div>
    </main>
  );
}
