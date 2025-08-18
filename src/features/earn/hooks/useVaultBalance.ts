import useSWR from "swr";
import { network } from "@/shared/lib/environmentVars";
import { VaultBalanceResponse } from "@defindex/sdk";

interface UseVaultBalanceProps {
  vaultId?: string | null;
  userAddress: string | null;
  vaultIds?: string[];
}

interface UseVaultBalanceReturn {
  vaultBalance: VaultBalanceResponse | null;
  vaultBalances: VaultBalance | null;
  isLoading: boolean;
  isError: boolean;
}

const fetchVaultBalance = async (
  vaultId: string,
  userAddress: string,
): Promise<VaultBalanceResponse> => {
  const res = await fetch("/api/earn/vaultBalance", {
    headers: {
      vaultId,
      userAddress,
      network,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const { data } = await res.json();
  return data as VaultBalanceResponse;
};

interface VaultBalance {
  [key: string]: VaultBalanceResponse;
}


const fetchMultipleVaultBalances = async (
  vaultIds: string[],
  userAddress: string,
): Promise<VaultBalance> => {
  const promises = vaultIds.map(async (vaultId) => {
    const balance = await fetchVaultBalance(vaultId, userAddress);
    return { vaultId, balance };
  });

  const results = await Promise.all(promises);

  const finalObject = results.reduce((acc, item) => {
    acc[item.vaultId] = item.balance;
    return acc;
  }, {} as VaultBalance);

  return finalObject; // ✅ Retorna o objeto final
};

export const useVaultBalance = ({
  vaultId,
  userAddress,
  vaultIds,
}: UseVaultBalanceProps): UseVaultBalanceReturn => {
  const {
    data: singleVaultBalance,
    error,
    isLoading,
  } = useSWR(
    vaultId && userAddress ? ["vault-balance", vaultId, userAddress] : null,
    () => fetchVaultBalance(vaultId!, userAddress!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min
    },
  );

  const {
    data: multipleVaultBalances,
    error: multipleError,
    isLoading: multipleLoading,
  } = useSWR(
    vaultIds && vaultIds.length > 0 && userAddress
      ? ["vault-balances", vaultIds.join(","), userAddress]
      : null,
    () => fetchMultipleVaultBalances(vaultIds!, userAddress!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min
    },
  );

  console.log("multipleVaultBalances", multipleVaultBalances);

  return {
    vaultBalance: singleVaultBalance || null,
    vaultBalances: multipleVaultBalances || null,
    isLoading: isLoading || multipleLoading,
    isError: Boolean(error) || Boolean(multipleError),
  };
};
