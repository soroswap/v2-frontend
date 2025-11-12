import useSWR from "swr";

/**
 * Batch-fetch prices for all provided contract addresses using the updated API.
 * Returns a map { [contract]: priceUSD }.
 */
const fetchBatchPrices = async ([, addresses]: [string, string[]]): Promise<
  Record<string, number>
> => {
  if (!addresses || addresses.length === 0) return {};

  try {
    // Use the new batch API endpoint
    const assetsParam = addresses.join(",");
    const res = await fetch(
      `/api/price?assets=${encodeURIComponent(assetsParam)}`,
      {
        method: "GET",
      },
    );

    if (!res.ok) {
      throw new Error(`Batch price fetch failed (${res.status})`);
    }

    const json = await res.json();

    // The API now returns { code, data: { [asset]: { price: number, ... } } }
    const priceMap = json?.data || {};

    // Extract just the price values for backward compatibility
    const result: Record<string, number> = {};
    Object.entries(priceMap).forEach(([asset, data]) => {
      const priceData = data as { price?: number };
      result[asset] = priceData?.price ?? 0;
    });

    return result;
  } catch (err) {
    console.error("[useBatchTokenPrices]", err);
    // Return empty map on error, individual prices will be 0
    return {};
  }
};

export function useBatchTokenPrices(addresses: string[]) {
  const key = addresses.length ? ["batch-prices", addresses] : null;

  const {
    data: priceMap,
    isLoading,
    error,
  } = useSWR(key, fetchBatchPrices, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 600000, // 10 minutes (increased from 5)
    refreshInterval: 300000, // Auto-refresh every 5 minutes in background
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  });

  return {
    priceMap: priceMap || {},
    isLoading,
    isError: error,
  } as const;
}
