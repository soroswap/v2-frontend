import { useMemo } from "react";
import useSWR from "swr";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { Pool, SupportedProtocols } from "@soroswap/sdk";

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

  return {
    pools,
    isLoading: remotePoolsLoading || tokenListLoading,
    isError: error,
  } as const;
}
