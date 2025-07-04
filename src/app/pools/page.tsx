/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";
import { useUserContext } from "@/contexts";
import { ConnectWallet } from "@/shared/components/buttons";
import { useTokensList } from "@/shared/hooks/useTokensList";

interface Pool {
  id: string;
  token0: { symbol: string; logo: string };
  token1: { symbol: string; logo: string };
  tvl: string; // e.g. "$4.78M"
  apr: string; // e.g. "11.2%"
  status: "Active" | "Inactive";
}

interface Position {
  id: string;
  amountFormatted?: string;
  // Extend with more fields once backend structure is known
}

// Raw shape returned by /api/pools
interface RemotePool {
  protocol?: string;
  address: string;
  tokenA: string;
  tokenB: string;
  reserveA: string;
  reserveB: string;
  ledger?: number;
}

export default function PoolsPage() {
  // --- MOCK DATA ------------------------------------------------------------
  const fallbackPools: Pool[] = [
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

  const { address } = useUserContext();

  // Grab on-chain token metadata (symbol, icon, decimals…)
  const { tokenMap, isLoading: tokenListLoading } = useTokensList();

  /* Fetch all Soroswap pools */
  const fetchPools = async (
    url: string,
    asset: string,
  ): Promise<RemotePool[]> => {
    const response = await fetch(url, { headers: { asset } });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log("result", result);
    return (result?.data as RemotePool[]) || [];
  };

  const { data: remotePools, isLoading: remotePoolsLoading } = useSWR(
    ["/api/pools", "soroswap"] as [string, string],
    ([url, asset]: [string, string]) => fetchPools(url, asset),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min cache
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    },
  );
  console.log("remotePools", remotePools);

  // Helper to convert raw Soroswap pool → UI-friendly structure
  const transformPool = (poolData: RemotePool): Pool => {
    const tokenAData = tokenMap[poolData.tokenA];
    const tokenBData = tokenMap[poolData.tokenB];

    return {
      id: poolData.address,
      token0: {
        symbol: tokenAData?.code || poolData.tokenA.slice(0, 4),
        logo: tokenAData?.icon || "/globe.svg",
      },
      token1: {
        symbol: tokenBData?.code || poolData.tokenB.slice(0, 4),
        logo: tokenBData?.icon || "/globe.svg",
      },
      tvl: "—", // TODO: compute TVL once price feeds available
      apr: "—", // TODO: compute APR once available from backend
      status: "Active",
    };
  };

  // Final list of pools shown in UI
  const pools: Pool[] = useMemo(() => {
    if (
      remotePools &&
      remotePools.length > 0 &&
      tokenMap &&
      Object.keys(tokenMap).length > 0
    ) {
      return remotePools.map(transformPool);
    }
    return fallbackPools;
  }, [remotePools, tokenMap]);

  const loadingPools = remotePoolsLoading || tokenListLoading;

  /* Fetch user liquidity positions (only when wallet connected) */
  const fetchPositions = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result?.data || [];
  };

  const { data: userPositions, isLoading: positionsLoading } = useSWR(
    address ? `/api/liquidity/positions/${address}` : null,
    fetchPositions,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    },
  );

  const avgApr = useMemo(() => {
    const active = pools.filter((p) => p.status === "Active");
    const totalApr = active.reduce((sum, p) => sum + parseFloat(p.apr), 0);
    return active.length ? `${(totalApr / active.length).toFixed(1)}%` : "—";
  }, [pools]);

  return (
    <main className="flex min-h-screen items-center justify-center p-2 pt-28 md:pt-0">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xl text-white sm:text-2xl">Pools</span>

          {/* "Add Liquidity" CTA – collapses to short label on very small screens */}
          <Link
            href="/add-liquidity"
            className="inline-flex items-center gap-2 rounded-full bg-[#8866DD]/20 px-3 py-1.5 text-sm font-medium text-[#8866DD] hover:bg-[#8866DD]/30"
          >
            <span className="text-lg leading-none">＋</span>
            <span className="xs:inline hidden">Add&nbsp;Liquidity</span>
            <span className="xs:hidden">Add</span>
          </Link>
        </div>

        {/* Top‑level metrics */}
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

        {/* Your liquidity */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Your liquidity
          </h2>

          {/* Wallet not connected */}
          {!address && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#23243a] bg-[#10121A]/70 p-6 text-center">
              <p className="text-sm text-[#A0A3C4]">
                Connect to a wallet to view your liquidity.
              </p>
              <ConnectWallet className="w-full max-w-xs" />
            </div>
          )}

          {/* Loading positions */}
          {address && positionsLoading && (
            <div
              className="skeleton h-24 w-full"
              aria-label="Loading positions"
            />
          )}

          {/* No positions */}
          {address &&
            !positionsLoading &&
            (!userPositions || userPositions.length === 0) && (
              <p className="text-sm text-[#A0A3C4]">
                You don&apos;t have liquidity positions yet.
              </p>
            )}

          {/* Positions list */}
          {address &&
            userPositions &&
            userPositions.length > 0 &&
            !positionsLoading && (
              <div className="flex gap-4 overflow-x-auto">
                {(userPositions as Position[]).map((pos) => (
                  <div
                    key={pos.id}
                    className="min-w-[220px] flex-shrink-0 rounded-2xl border border-[#23243a] bg-[#10121A]/70 p-4"
                  >
                    <p className="mb-2 text-xs text-[#A0A3C4]">POSITION SIZE</p>
                    <p className="font-medium break-all text-white">
                      {pos.amountFormatted || "-"}
                    </p>
                  </div>
                ))}
              </div>
            )}
        </section>

        {/* All pools */}
        <section>
          <h2 className="sr-only">All pools</h2>

          {/* Pool list */}
          <div className="space-y-4">
            {loadingPools &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-20 w-full" />
              ))}

            {!loadingPools &&
              pools.map((pool, index) => (
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
        </section>
      </div>
    </main>
  );
}
