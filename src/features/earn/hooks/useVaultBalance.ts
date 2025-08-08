import useSWR from "swr";
import { network } from "@/shared/lib/environmentVars";
import { VaultBalanceResponse } from "@defindex/sdk";

interface UseVaultBalanceProps {
  vaultId: string | null;
  userAddress: string | null;
}

interface UseVaultBalanceReturn {
  vaultBalance: VaultBalanceResponse | null;
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

export const useVaultBalance = ({
  vaultId,
  userAddress,
}: UseVaultBalanceProps): UseVaultBalanceReturn => {
  const {
    data: vaultBalance,
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

  return {
    vaultBalance: vaultBalance || null,
    isLoading,
    isError: Boolean(error),
  };
};
