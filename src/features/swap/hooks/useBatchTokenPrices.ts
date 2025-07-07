import useSWR from "swr";

/**
 * Fetch price for a single asset from the existing /api/price endpoint.
 */
const fetchSinglePrice = async (asset: string): Promise<number> => {
  const res = await fetch("/api/price", {
    method: "GET",
    headers: {
      asset,
    },
  });

  if (!res.ok) {
    throw new Error(`Price fetch failed (${res.status}) for asset ${asset}`);
  }

  const json = await res.json();
  // Endpoint returns { code, data: { price: number, ... } }
  return json?.data?.price ?? 0;
};

/**
 * Batch-fetch prices for all provided contract addresses.
 * Returns a map { [contract]: priceUSD }.
 */
const fetchBatchPrices = async ([, addresses]: [string, string[]]): Promise<
  Record<string, number>
> => {
  if (!addresses || addresses.length === 0) return {};

  const entries = await Promise.all(
    addresses.map(async (addr) => {
      try {
        const price = await fetchSinglePrice(addr);
        return [addr, price] as [string, number];
      } catch (err) {
        console.error("[useBatchTokenPrices]", err);
        return [addr, 0] as [string, number];
      }
    }),
  );

  return Object.fromEntries(entries);
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
    dedupingInterval: 300000, // 5 minutes
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  });

  return {
    priceMap: priceMap || {},
    isLoading,
    isError: error,
  } as const;
}
