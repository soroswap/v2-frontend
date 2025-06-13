import useSWR from "swr";
import { TokenList } from "@/components/TokenSelector/types/token";
import { TOKEN_LIST_URL } from "@/lib/constants/tokenList";

const fetchTokenList = async () => {
  try {
    const response = await fetch(TOKEN_LIST_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const tokensList: TokenList[] = data.assets;
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
    dedupingInterval: 60000,
    refreshInterval: 300000,
    errorRetryCount: 3,
    shouldRetryOnError: true,
    suspense: false,
    fallbackData: [],
  });

  return {
    tokensList: data || [],
    isLoading,
    isError: error,
  };
};
