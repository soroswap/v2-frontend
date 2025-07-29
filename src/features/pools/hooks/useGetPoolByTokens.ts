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
const fetchPoolByTokens = async (
  tokenA: string,
  tokenB: string,
): Promise<Pool[] | null> => {
  const res = await fetch("/api/pools/token", {
    headers: {
      tokenA,
      tokenB,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const { data } = await res.json();
  return data as Pool[] | null;
};

export const useGetPoolByTokens = ({
  tokenAContract,
  tokenBContract,
}: UseGetPoolByTokensProps): UseGetPoolByTokensReturn => {
  // Call SWR only when both contracts are defined
  const {
    data: pool,
    error,
    isLoading,
  } = useSWR(
    tokenAContract && tokenBContract
      ? ["pool", tokenAContract, tokenBContract]
      : null,
    () => fetchPoolByTokens(tokenAContract!, tokenBContract!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min
    },
  );

  const ratio: number | null =
    pool && pool.length > 0 && pool[0]
      ? pool[0].tokenA === tokenAContract
        ? Number(pool[0].reserveB) / Number(pool[0].reserveA)
        : Number(pool[0].reserveA) / Number(pool[0].reserveB)
      : null;

  return {
    pool: pool?.[0] || null,
    ratio,
    isLoading,
    isError: Boolean(error),
  };
};
