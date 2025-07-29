/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo } from "react";

interface Pool {
  id: string;
  token0: { symbol: string; logo: string };
  token1: { symbol: string; logo: string };
  tvl: string; // e.g. "$4.78M"
  apr: string; // e.g. "11.2%"
  status: "Active" | "Inactive";
}

export default function PoolsPage() {
  // --- MOCK DATA ------------------------------------------------------------
  const pools: Pool[] = [
    {
      id: "xlm-usdc",
      token0: {
        symbol: "XLM",
        logo: "https://ipfs.io/ipfs/QmXEkrYLhmVJCGJ9AhxQypF3eS4aUUQX3PTef31gmEfyJo/",
      },
      token1: {
        symbol: "USDC",
        logo: "https://ipfs.io/ipfs/bafkreibpzncuhbk5ozhdw7xkcdoyf3xhwhcwcf6sj7axjzimxw6vm6pvyy",
      },
      tvl: "$4.78M",
      apr: "11.2%",
      status: "Active",
    },
    {
      id: "xlm-btc",
      token0: {
        symbol: "XLM",
        logo: "https://ipfs.io/ipfs/QmXEkrYLhmVJCGJ9AhxQypF3eS4aUUQX3PTef31gmEfyJo/",
      },
      token1: {
        symbol: "WBTC",
        logo: "https://ipfs.io/ipfs/bafkreihbyszxadmibtyidcdi7ume4fosyb3yjcqwcazfkfjez722wdiw6u",
      },
      tvl: "$1.21M",
      apr: "8.4%",
      status: "Inactive",
    },
    {
      id: "usdc-usdt",
      token0: {
        symbol: "USDC",
        logo: "https://ipfs.io/ipfs/bafkreibpzncuhbk5ozhdw7xkcdoyf3xhwhcwcf6sj7axjzimxw6vm6pvyy",
      },
      token1: {
        symbol: "USDT",
        logo: "https://ipfs.io/ipfs/bafkreiby2lmnaavh3md6ontok7s6sarhn24ypp2dgjveynbhliqpfjjtkq",
      },
      tvl: "$3.05M",
      apr: "7.9%",
      status: "Active",
    },
  ];
  // -------------------------------------------------------------------------

  const avgApr = useMemo(() => {
    const active = pools.filter((p) => p.status === "Active");
    const totalApr = active.reduce((sum, p) => sum + parseFloat(p.apr), 0);
    return active.length ? `${(totalApr / active.length).toFixed(1)}%` : "—";
  }, [pools]);

  return (
    <main className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center p-2">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xl text-white sm:text-2xl">Pools</span>

          {/* "Add Liquidity" CTA – collapses to short label on very small screens */}
          <Link
            href="/add-liquidity"
            className="bg-brand/20 hover:bg-brand/30 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[#8866DD]"
          >
            <span className="text-lg leading-none">＋</span>
            <span className="xs:inline hidden">Add&nbsp;Liquidity</span>
            <span className="xs:hidden">Add</span>
          </Link>
        </div>

        {/* Top-level metrics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#23243a] bg-[#10121A] p-4">
            <span className="text-sm text-[#A0A3C4]">Total TVL</span>
            <div className="text-xl font-bold text-white sm:text-2xl">6.2M</div>
          </div>
          <div className="rounded-2xl border border-[#23243a] bg-[#10121A] p-4">
            <span className="text-sm text-[#A0A3C4]">Active Pools</span>
            <div className="text-xl font-bold text-white sm:text-2xl">
              {pools.filter((p) => p.status === "Active").length}
            </div>
          </div>
          <div className="rounded-2xl border border-[#23243a] bg-[#10121A] p-4">
            <span className="text-sm text-[#A0A3C4]">Avg. APR (active)</span>
            <div className="text-xl font-bold text-white sm:text-2xl">
              {avgApr}
            </div>
          </div>
        </div>

        {/* Pool list */}
        <div className="space-y-4">
          {pools.map((pool, index) => (
            <div
              key={pool.id}
              className="flex items-center justify-between rounded-2xl border border-[#23243a] bg-[#10121A]/70 p-3 transition hover:bg-[#10121A] sm:p-4"
            >
              {/* Pair section */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={pool.token0.logo}
                    alt={pool.token0.symbol}
                    width={32}
                    height={32}
                    className="rounded-full border border-white bg-white"
                  />
                  <img
                    src={pool.token1.logo}
                    alt={pool.token1.symbol}
                    width={32}
                    height={32}
                    className="absolute top-0 left-4 rounded-full border border-white bg-white"
                  />
                </div>
                <span className="font-semibold text-white">
                  {pool.token0.symbol}/{pool.token1.symbol}
                </span>
              </div>

              {/* Stats & actions */}
              <div className="flex flex-col items-start gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
                {index === 0 && (
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[#A0A3C4]">
                      YOUR POSITION
                    </span>
                    <div className="font-medium break-all text-white">
                      10,000&nbsp;XLM/USDC
                    </div>
                  </div>
                )}
                <div className="text-right">
                  <span className="text-xs text-[#A0A3C4]">TVL</span>
                  <div className="text-base font-medium text-white sm:text-lg">
                    {pool.tvl}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#A0A3C4]">APR</span>
                  <div className="text-base font-medium text-white sm:text-lg">
                    {pool.apr}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
