import useSWR from "swr";
import { AssetInfo } from "@soroswap/sdk";
import { xlmTokenList } from "@/shared/lib/constants/tokenList";
import { network } from "@/shared/lib/environmentVars";
import { useMemo } from "react";

interface TokensApiResponse {
  code: string;
  data: AssetInfo[];
  metadata?: {
    name: string;
    provider?: string;
    version?: string;
    network?: string;
  };
}

const fetchTokenList = async (): Promise<AssetInfo[]> => {
  try {
    // Fetch token list from our API route which uses the SDK server-side
    const response = await fetch("/api/tokens");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: TokensApiResponse = await response.json();

    if (result.code !== "TOKENS_SUCCESS") {
      throw new Error("Failed to fetch tokens from API");
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching token list from API:", error);
    throw error;
  }
};

// Prepare fallback data outside the hook to avoid recalculating on every render
const prepareFallbackData = (): AssetInfo[] => {
  const xlmToken = xlmTokenList.find((set) => set.network === network)?.assets;
  const assets: AssetInfo[] = [];

  if (xlmToken && xlmToken[0]) {
    assets.unshift(xlmToken[0] as AssetInfo);
  }

  return assets;
};

const fallbackData = prepareFallbackData();

export const useTokensList = () => {
  const { data, error, isLoading } = useSWR(
    `token-list-${network}`, // Include network in key to avoid cache conflicts
    fetchTokenList,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 43200000, // 12 hours
      refreshInterval: 86400000, // 24 hours
      errorRetryCount: 3,
      shouldRetryOnError: true,
      suspense: false,
      fallbackData,
      keepPreviousData: false, // Don't keep old data when switching networks
    },
  );

  // Dictionary for 0(1) lookups by contract
  const tokenMap = useMemo(() => {
    return (data || []).reduce(
      (acc, token) => {
        acc[token.contract ?? ""] = token;
        return acc;
      },
      {} as Record<string, AssetInfo>,
    );
  }, [data]);

  // Map by token code for quick lookup by symbol (case-insensitive)
  const tokenCodeMap = useMemo(() => {
    return (data || []).reduce(
      (acc, token) => {
        if (token.code) {
          acc[token.code.toUpperCase()] = token;
        }
        return acc;
      },
      {} as Record<string, AssetInfo>,
    );
  }, [data]);

  return {
    tokensList: data || [],
    tokenMap,
    tokenCodeMap,
    isLoading,
    isError: error,
  };
};
