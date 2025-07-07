import { useMemo } from "react";
import useSWR from "swr";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { Pool, SupportedProtocols } from "@soroswap/sdk";
import { useBatchTokenPrices } from "@/features/swap/hooks/useBatchTokenPrices";
import { calculateTvl } from "@/shared/lib/utils";

const FALLBACK_POOLS: Pool[] = [
  {
    protocol: SupportedProtocols.SOROSWAP,
    address: "xlm-usdc",
    tokenA: "xlm",
    tokenB: "usdc",
    reserveA: BigInt(1000000000000000000),
    reserveB: BigInt(1000000000000000000),
    ledger: Number(1000000000000000000),
    reserveLp: BigInt(1000000000000000000),
    stakeAddress: "0x0000000000000000000000000000000000000000",
    poolType: "pool",
    fee: BigInt(1000000000000000000),
    totalFeeBps: 10000,
    tokenC: "usdt",
    involvesAsset: (asset: string) => {
      return asset === "xlm" || asset === "usdc" || asset === "usdt";
    },
  },
];

const fetchPools = async (url: string, asset: string): Promise<Pool[]> => {
  const response = await fetch(url, { headers: { asset } });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const { data } = await response.json();
  return (data as Pool[]) || [];
};

export function usePools() {
  const { tokenMap, isLoading: tokenListLoading } = useTokensList();

  const {
    data: remotePools,
    isLoading: remotePoolsLoading,
    error,
  } = useSWR<Pool[]>(
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

  const pools: Pool[] = useMemo(() => {
    if (
      remotePools &&
      remotePools.length > 0 &&
      tokenMap &&
      Object.keys(tokenMap).length > 0
    ) {
      return remotePools.map((pool) => {
        const tokenAData = tokenMap[pool.tokenA];
        const tokenBData = tokenMap[pool.tokenB];

        return {
          ...pool,
          tokenA: tokenAData?.code || pool.tokenA.slice(0, 4),
          tokenB: tokenBData?.code || pool.tokenB.slice(0, 4),
          tvl: "—", // TODO: compute when prices available
          apr: "—", // TODO
          status: "Active",
        } as Pool;
      });
    }
    return FALLBACK_POOLS;
  }, [remotePools, tokenMap]);

  /* ------------------------------ TVL helpers ------------------------------ */

  // Collect unique contract addresses from the fetched pools so that we can
  // request their USD prices in bulk.
  const tokenAddresses = useMemo(() => {
    if (!remotePools || remotePools.length === 0) return [] as string[];

    const set = new Set<string>();
    remotePools.forEach((p) => {
      if (p.tokenA) set.add(p.tokenA);
      if (p.tokenB) set.add(p.tokenB);
    });
    return Array.from(set);
  }, [remotePools]);

  const {
    priceMap,
    isLoading: pricesLoading,
    isError: pricesError,
  } = useBatchTokenPrices(tokenAddresses);

  // Compute pools enriched with tvl once we have price information.
  const enrichedPools: Pool[] = useMemo(() => {
    if (
      !remotePools ||
      !tokenMap ||
      !priceMap ||
      Object.keys(tokenMap).length === 0
    ) {
      return pools;
    }

    return remotePools.map((pool) => {
      const tokenAData = tokenMap[pool.tokenA];
      const tokenBData = tokenMap[pool.tokenB];

      const tvlBigInt = calculateTvl({
        tokenAContract: pool.tokenA,
        tokenBContract: pool.tokenB,
        reserveA: pool.reserveA,
        reserveB: pool.reserveB,
        tokenMap,
        priceMap,
      });

      return {
        ...pool,
        tokenA: tokenAData?.code || pool.tokenA.slice(0, 4),
        tokenB: tokenBData?.code || pool.tokenB.slice(0, 4),
        tvl: tvlBigInt,
        apr: "—",
        status: "Active",
      } as Pool;
    });
  }, [remotePools, tokenMap, priceMap]);

  return {
    pools: enrichedPools,
    isLoading: remotePoolsLoading || tokenListLoading || pricesLoading || false,
    isError: error || pricesError,
  } as const;
}
