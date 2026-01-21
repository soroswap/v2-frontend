import useSWR from "swr";
import { network } from "@/shared/lib/environmentVars";
import { useMemo, useCallback } from "react";

/**
 * Token asset information from the balance response
 */
interface TokenAsset {
  code: string;
  issuer?: string;
  contract: string;
  name?: string;
  icon?: string;
  decimals: number;
}

/**
 * Individual token balance
 */
export interface TokenBalance {
  asset: TokenAsset;
  amount: string; // Human-readable balance
  rawAmount: string; // Balance in smallest unit (stroops)
  available: string; // Spendable balance (XLM minus reserves)
  availableRaw: string; // Spendable balance in smallest unit
}

/**
 * Response from the balance API
 */
interface BalancesResponse {
  wallet: string;
  network: string;
  balances: TokenBalance[];
  updatedAt: string;
}

interface BalanceApiResponse {
  code: string;
  data: BalancesResponse;
}

const fetchBalances = async (address: string): Promise<BalancesResponse> => {
  const response = await fetch("/api/balance", {
    headers: { address },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: BalanceApiResponse = await response.json();

  if (result.code !== "BALANCE_SUCCESS") {
    throw new Error("Failed to fetch balances from API");
  }

  return result.data;
};

export interface UseUserBalancesReturn {
  /** Array of all token balances */
  balances: TokenBalance[];
  /** O(1) lookup map by contract address */
  balanceMap: Record<string, TokenBalance>;
  /** Whether balances are currently loading */
  isLoading: boolean;
  /** Whether there was an error fetching balances */
  isError: boolean;
  /** Function to manually revalidate balances */
  revalidate: () => void;
  /** Get balance for a specific token by contract address */
  getBalance: (contractAddress: string) => TokenBalance | null;
  /** Get available (spendable) amount for a token - uses 'available' for XLM */
  getAvailableAmount: (contractAddress: string) => string;
}

/**
 * Hook to fetch and manage user token balances
 *
 * @param userAddress - The user's Stellar wallet address, or null if not connected
 * @returns Balance data and utility functions
 *
 * @example
 * ```tsx
 * const { getAvailableAmount, isLoading } = useUserBalances(userAddress);
 * const xlmBalance = getAvailableAmount(xlmContract);
 * ```
 */
export const useUserBalances = (
  userAddress: string | null,
): UseUserBalancesReturn => {
  const { data, error, isLoading, mutate } = useSWR(
    userAddress ? [`user-balances-${network}`, userAddress] : null,
    () => fetchBalances(userAddress!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute deduping
      refreshInterval: 300000, // 5 minute auto-refresh
      errorRetryCount: 3,
      shouldRetryOnError: true,
    },
  );

  // Create O(1) lookup map by contract address
  const balanceMap = useMemo(() => {
    return (data?.balances || []).reduce(
      (acc, balance) => {
        if (balance.asset.contract) {
          acc[balance.asset.contract] = balance;
        }
        return acc;
      },
      {} as Record<string, TokenBalance>,
    );
  }, [data?.balances]);

  // Get balance for a specific token
  const getBalance = useCallback(
    (contractAddress: string): TokenBalance | null => {
      return balanceMap[contractAddress] || null;
    },
    [balanceMap],
  );

  // Get available (spendable) amount for a token
  // Uses 'available' for XLM to account for Stellar base reserves
  const getAvailableAmount = useCallback(
    (contractAddress: string): string => {
      const balance = balanceMap[contractAddress];
      if (!balance) return "0";

      // XLM uses 'available' which accounts for base reserves
      if (balance.asset.code === "XLM") {
        return balance.available;
      }
      return balance.amount;
    },
    [balanceMap],
  );

  return {
    balances: data?.balances || [],
    balanceMap,
    isLoading,
    isError: Boolean(error),
    revalidate: () => mutate(undefined, { revalidate: true }),
    getBalance,
    getAvailableAmount,
  };
};
