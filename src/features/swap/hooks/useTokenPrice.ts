import useSWR from "swr";
import { PriceData } from "@soroswap/sdk";
import { isStellarAddress } from "@/shared/lib/utils/isStellarAddress";

interface PriceResponse {
  code: string;
  data: PriceData;
}

interface BatchPriceResponse {
  code: string;
  data: Record<string, PriceData>;
}

const fetcher = async (
  url: string,
  contractAddress: string,
): Promise<PriceResponse> => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      asset: contractAddress,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  return {
    code: result.code,
    data: result.data,
  };
};

const batchFetcher = async (
  url: string,
  contractAddresses: string[],
): Promise<BatchPriceResponse> => {
  const assetsParam = contractAddresses.join(",");
  const response = await fetch(
    `${url}?assets=${encodeURIComponent(assetsParam)}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  return {
    code: result.code,
    data: result.data,
  };
};

export function useTokenPrice(contractAddress: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    contractAddress ? ["/api/price", contractAddress] : null,
    ([url, address]) => fetcher(url, address),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3000000, // 50 minutes cache
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    },
  );

  return {
    price: data?.data.price || null,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTokenPrices(contractAddresses: (string | null)[]) {
  // Filter out null addresses and create a stable array
  const validAddresses = contractAddresses.filter(
    (addr): addr is string => addr !== null && isStellarAddress(addr),
  );

  const { data, error, isLoading, mutate } = useSWR(
    validAddresses.length > 0 ? ["/api/price", validAddresses] : null,
    ([url, addresses]) => batchFetcher(url, addresses),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3000000, // 50 minutes cache
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    },
  );

  // Map the results back to the original array order, with null for invalid addresses
  const prices = contractAddresses.map((address) => {
    if (address === null) return null;
    return data?.data[address]?.price || null;
  });

  return {
    prices,
    isLoading,
    isError: error,
    mutateAll: mutate,
  };
}
