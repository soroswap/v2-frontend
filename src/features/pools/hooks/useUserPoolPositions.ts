import { UserPosition } from "@soroswap/sdk";
import useSWR from "swr";

const fetchUserPositions = async (address: string): Promise<UserPosition[]> => {
  const response = await fetch("/api/pools/user", {
    headers: {
      address,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const { data } = await response.json();
  return data || [];
};

export function useUserPoolPositions(address: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    address ? ["user-pools-positions", address] : null,
    () => fetchUserPositions(address as string),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    },
  );

  return {
    positions: data || [],
    isLoading,
    isError: error,
    mutate,
  } as const;
}
