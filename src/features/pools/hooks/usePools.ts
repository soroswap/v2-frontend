import { useMemo } from "react";
import useSWR from "swr";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { Pool, SupportedProtocols } from "@soroswap/sdk";
import { useBatchTokenPrices } from "@/features/swap/hooks/useBatchTokenPrices";
import { calculateTvl } from "@/shared/lib/utils";

//TODO: Adjust to use the getPoolByTokens hook or create it to use it in the add liquidity page
const FALLBACK_POOLS: Pool[] = [
  {
    protocol: SupportedProtocols.SOROSWAP,
    address: "CAM7DY53G63XA4AJRS24Z6VFYAFSSF76C3RZ45BE5YU3FQS5255OOABP",
    // Use valid XLM and USDC contract addresses from mainnet token list
    tokenA: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", // XLM
    tokenB: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", // USDC
    reserveA: BigInt(1000000000000000000),
    reserveB: BigInt(1000000000000000000),
    ledger: Number(1000000000000000000),
    reserveLp: BigInt(1000000000000000000),
    stakeAddress: "0x0000000000000000000000000000000000000000",
    poolType: "pool",
    fee: BigInt(1000000000000000000),
    totalFeeBps: 10000,
    involvesAsset: (asset: string) => {
      return (
        asset === "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA" ||
        asset === "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75"
      );
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
    mutate: mutatePools,
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
        return {
          ...pool,
          tokenA: pool.tokenA,
          tokenB: pool.tokenB,
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

  const { priceMap, isError: pricesError } = useBatchTokenPrices(tokenAddresses);

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
        tokenA: pool.tokenA,
        tokenB: pool.tokenB,
        tvl: tvlBigInt,
        apr: "—",
        status: "Active",
      } as Pool;
    });
  }, [remotePools, tokenMap, priceMap, pools]);

  const revalidate = () => {
    mutatePools();
  };

  return {
    pools: priceMap && Object.keys(priceMap).length > 0 ? enrichedPools : pools,
    rawPools: remotePools ?? [],
    isLoading: remotePoolsLoading || tokenListLoading || false,
    isError: error || pricesError,
    revalidate,
  } as const;
}
