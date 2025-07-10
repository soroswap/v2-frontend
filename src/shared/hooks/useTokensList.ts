import useSWR from "swr";
import { AssetInfo } from "@soroswap/sdk";
import { TOKEN_LIST_URL, xlmTokenList } from "@/shared/lib/constants/tokenList";
import { network } from "@/shared/lib/environmentVars";
import { useMemo } from "react";

const fetchTokenList = async () => {
  try {
    const xlmToken = xlmTokenList.find(
      (set) => set.network === network,
    )?.assets;

    const response = await fetch(TOKEN_LIST_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (xlmToken) {
      data.assets.unshift(xlmToken[0]);
    }
    const tokensList: AssetInfo[] = data.assets;
    return tokensList;
  } catch (error) {
    console.error("Error fetching token list:", error);
    throw error;
  }
};

export const useTokensList = () => {
  const { data, error, isLoading } = useSWR("token-list", fetchTokenList, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 43200000, // 12 hours
    refreshInterval: 86400000, // 24 hours
    errorRetryCount: 3,
    shouldRetryOnError: true,
    suspense: false,
    fallbackData: [],
  });

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
