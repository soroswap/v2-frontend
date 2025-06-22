/* eslint-disable react-hooks/rules-of-hooks */
import useSWR from "swr";

interface PriceData {
  price: number;
}

interface PriceResponse {
  data: PriceData;
}

const fetcher = async (
  url: string,
  contractAddress: string,
): Promise<number> => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      asset: contractAddress,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: PriceResponse = await response.json();
  return result.data.price;
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
    price: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useTokenPrices(contractAddresses: (string | null)[]) {
  const results = contractAddresses.map((address) => useTokenPrice(address));

  return {
    prices: results.map((result) => result.price),
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    mutateAll: () => results.forEach((result) => result.mutate()),
  };
}
