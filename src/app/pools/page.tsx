"use client";

import Link from "next/link";
import { UserLiquidity } from "@/features/pools/components/UserLiquidity";
import { SoroSwapAllLiquidityPools } from "@/features/pools/components/SoroSwapAllLiquidityPools";
import { PlusIcon } from "lucide-react";
import { xlmTokenList } from "@/shared/lib/constants/tokenList";
import { network } from "@/shared/lib/environmentVars";

export default function PoolsPage() {

  const xlmContract = xlmTokenList.find((xlms) => xlms.network === network)?.assets[0].contract

  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center px-4 py-10 md:px-1">
      <div className="bg-surface flex w-full max-w-7xl flex-col rounded-2xl border border-[#8866DD] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-primary text-xl sm:text-2xl">Pools</p>

          {/* "Add Liquidity" CTA – collapses to short label on very small screens */}
          <Link
            href={`/pools/add-liquidity/${xlmContract}/`}
            className="bg-brand/20 hover:bg-brand/30 text-brand inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
          >
            <span className="text-lg leading-none">
              <PlusIcon />
            </span>
            <p className="hidden sm:inline">Create&nbsp;Pool</p>
            <p className="sm:hidden">Create</p>
          </Link>
        </div>

        <UserLiquidity />

        <SoroSwapAllLiquidityPools />
      </div>
    </main>
  );
}
