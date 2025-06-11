"use client";

import Image from "next/image";
import Link from "next/link";
import ConnectWallet from "@/components/Buttons/ConnectWallet";
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
        logo:
          "https://ipfs.io/ipfs/QmXEkrYLhmVJCGJ9AhxQypF3eS4aUUQX3PTef31gmEfyJo/",
      },
      token1: {
        symbol: "USDC",
        logo:
          "https://ipfs.io/ipfs/bafkreibpzncuhbk5ozhdw7xkcdoyf3xhwhcwcf6sj7axjzimxw6vm6pvyy",
      },
      tvl: "$4.78M",
      apr: "11.2%",
      status: "Active",
    },
    {
      id: "xlm-btc",
      token0: {
        symbol: "XLM",
        logo:
          "https://ipfs.io/ipfs/QmXEkrYLhmVJCGJ9AhxQypF3eS4aUUQX3PTef31gmEfyJo/",
      },
      token1: {
        symbol: "WBTC",
        logo:
          "https://ipfs.io/ipfs/bafkreihbyszxadmibtyidcdi7ume4fosyb3yjcqwcazfkfjez722wdiw6u",
      },
      tvl: "$1.21M",
      apr: "8.4%",
      status: "Inactive",
    },
    {
      id: "usdc-usdt",
      token0: {
        symbol: "USDC",
        logo:
          "https://ipfs.io/ipfs/bafkreibpzncuhbk5ozhdw7xkcdoyf3xhwhcwcf6sj7axjzimxw6vm6pvyy",
      },
      token1: {
        symbol: "USDT",
        logo:
          "https://ipfs.io/ipfs/bafkreiby2lmnaavh3md6ontok7s6sarhn24ypp2dgjveynbhliqpfjjtkq",
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
    <main className="flex items-center justify-center min-h-screen p-2">
      <div className="rounded-2xl border border-[#8866DD] bg-[#181A25] shadow-xl p-4 sm:p-8 w-full max-w-3xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-white text-xl sm:text-2xl">Pools</span>
        </div>

        {/* Top‑level metrics */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#10121A] rounded-2xl p-4 border border-[#23243a]">
            <span className="text-[#A0A3C4] text-sm">Total TVL</span>
            <div className="text-white text-2xl font-bold">6.2M</div>
          </div>
          <div className="bg-[#10121A] rounded-2xl p-4 border border-[#23243a]">
            <span className="text-[#A0A3C4] text-sm">Active Pools</span>
            <div className="text-white text-2xl font-bold">
              {pools.filter((p) => p.status === "Active").length}
            </div>
          </div>
          <div className="bg-[#10121A] rounded-2xl p-4 border border-[#23243a]">
            <span className="text-[#A0A3C4] text-sm">Avg. APR (active)</span>
            <div className="text-white text-2xl font-bold">{avgApr}</div>
          </div>
        </div>

        {/* Pool list */}
        <div className="space-y-4">
          {pools.map((pool, index) => (
            <div
              key={pool.id}
              className="bg-[#10121A]/70 hover:bg-[#10121A] transition rounded-2xl p-4 border border-[#23243a] flex items-center justify-between"
            >
              {/* Pair section */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={pool.token0.logo}
                    alt={pool.token0.symbol}
                    width={32}
                    height={32}
                    className="rounded-full border bg-white border-white"
                  />
                  <img
                    src={pool.token1.logo}
                    alt={pool.token1.symbol}
                    width={32}
                    height={32}
                    className="rounded-full border bg-white border-white absolute left-4 top-0"
                  />
                </div>
                <span className="text-white font-semibold">
                  {pool.token0.symbol}/{pool.token1.symbol}
                </span>
              </div>

              {/* Stats & actions */}
              <div className="flex gap-6 items-center">
                {index === 0 && (
                  <div className="text-right">
                    <span className="text-[#A0A3C4] text-xs">POSITION</span>
                    <div className="text-white font-medium">10,000 XLM/USDC</div>
                  </div>
                )}
                <div className="text-right">
                  <span className="text-[#A0A3C4] text-xs">TVL</span>
                  <div className="text-white font-medium">{pool.tvl}</div>
                </div>
                <div className="text-right">
                  <span className="text-[#A0A3C4] text-xs">APR</span>
                  <div className="text-white font-medium">{pool.apr}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
