import useSWR from "swr";
import { Pool } from "@soroswap/sdk";

interface UseGetPoolByTokensProps {
  tokenAContract: string | null;
  tokenBContract: string | null;
}

interface UseGetPoolByTokensReturn {
  pool: Pool | null;
  ratio: number | null; // reserveB / reserveA (TOKEN_B per TOKEN_A)
  isLoading: boolean;
  isError: boolean;
}

// --- Internal fetcher ------------------------------------------------------
const fetchPools = async (): Promise<Pool[]> => {
  const res = await fetch("/api/pools", { headers: { asset: "soroswap" } });
  if (!res.ok) throw new Error(await res.text());
  const { data } = await res.json();
  return data as Pool[];
};

export const useGetPoolByTokens = ({
  tokenAContract,
  tokenBContract,
}: UseGetPoolByTokensProps): UseGetPoolByTokensReturn => {
  // Call SWR only when both contracts are defined
  const { data, error, isLoading } = useSWR(
    tokenAContract && tokenBContract
      ? ["pools", tokenAContract, tokenBContract]
      : null,
    fetchPools,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min
    },
  );

  const pool: Pool | null = (() => {
    if (!data || !tokenAContract || !tokenBContract) return null;
    return (
      data.find(
        (p) =>
          (p.tokenA === tokenAContract && p.tokenB === tokenBContract) ||
          (p.tokenA === tokenBContract && p.tokenB === tokenAContract),
      ) || null
    );
  })();

  const ratio: number | null = pool
    ? pool.tokenA === tokenAContract
      ? Number(pool.reserveB) / Number(pool.reserveA)
      : Number(pool.reserveA) / Number(pool.reserveB)
    : null;

  return {
    pool,
    ratio,
    isLoading,
    isError: Boolean(error),
  };
};
