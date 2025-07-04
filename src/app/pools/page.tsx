"use client";

import Link from "next/link";
import { UserLiquidity } from "@/features/pools/components/UserLiquidity";
import { SoroSwapAllLiquidityPools } from "@/features/pools/components/SoroSwapAllLiquidityPools";
import { PlusIcon } from "lucide-react";

export default function PoolsPage() {
  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center px-4 md:px-1">
      <div className="flex w-full max-w-7xl flex-col rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xl text-white sm:text-2xl">Pools</span>

          {/* "Add Liquidity" CTA – collapses to short label on very small screens */}
          <Link
            href="/add-liquidity"
            className="inline-flex items-center gap-2 rounded-full bg-[#8866DD]/20 px-3 py-1.5 text-sm font-medium text-[#8866DD] hover:bg-[#8866DD]/30"
          >
            <span className="text-lg leading-none">
              <PlusIcon />
            </span>
            <span className="xs:inline hidden">Add&nbsp;Liquidity</span>
            <span className="xs:hidden">Add</span>
          </Link>
        </div>

        {/* Top‑level metrics */}
        {/* <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#23243a] bg-[#10121A] p-4">
          <span className="text-sm text-[#A0A3C4]">Total TVL</span>
          <div className="text-xl font-bold text-white sm:text-2xl">6.2M</div>
        </div>
        <div className="rounded-2xl border border-[#23243a] bg-[#10121A] p-4">
          <span className="text-sm text-[#A0A3C4]">Active Pools</span>
          <div className="text-xl font-bold text-white sm:text-2xl">
            {pools.filter((p) => p.poolType === "pool").length}
          </div>
        </div>
        <div className="rounded-2xl border border-[#23243a] bg-[#10121A] p-4">
          <span className="text-sm text-[#A0A3C4]">Avg. APR (active)</span>
          <div className="text-xl font-bold text-white sm:text-2xl">
            {avgApr}
          </div>
        </div>
      </div> */}

        <UserLiquidity />

        <SoroSwapAllLiquidityPools />
      </div>
    </main>
  );
}
