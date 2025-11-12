import useSWR from "swr";
import { AssetInfo } from "@soroswap/sdk";

interface TokenMetadataResponse {
  code: string;
  data: AssetInfo;
  cached?: boolean;
}

const fetcher = async (
  url: string,
  contract: string,
): Promise<AssetInfo | null> => {
  try {
    const response = await fetch(
      `${url}?contract=${encodeURIComponent(contract)}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      // Don't throw on 500s, just return null
      console.warn(
        `Failed to fetch metadata for ${contract}: ${response.status}`,
      );
      return null;
    }

    const result: TokenMetadataResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error(`[useTokenMetadata] Error fetching ${contract}:`, error);
    return null;
  }
};

/**
 * Hook to fetch token metadata on-demand from Soroban smart contracts.
 * Uses SWR for caching and automatic revalidation.
 *
 * @param contractAddress - The Soroban contract address to fetch metadata for
 * @returns Object with metadata, loading state, and error state
 */
export function useTokenMetadata(contractAddress: string | null) {
  // Only fetch on client-side to avoid SSR fetching before tokenMap is ready
  const isClient = typeof window !== "undefined";

  const { data, error, isLoading } = useSWR(
    contractAddress && isClient ? ["/api/token/metadata", contractAddress] : null,
    ([url, address]) => fetcher(url, address),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 43200000, // 12 hours - metadata doesn't change
      errorRetryCount: 2,
      errorRetryInterval: 2000,
      shouldRetryOnError: true,
    },
  );

  return {
    metadata: data || null,
    isLoading,
    isError: !!error,
  };
}
