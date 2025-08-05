import useSWR from "swr";
import { network } from "@/shared/lib/environmentVars";
import { VaultInfoResponse } from "@defindex/sdk";

interface UseEarnProps {
  vaultId: string | null;
}

interface UseEarnReturn {
  vaultInfo: VaultInfoResponse | null;
  isLoading: boolean;
  isError: boolean;
}

const fetchVaultInfo = async (vaultId: string): Promise<VaultInfoResponse> => {
  const res = await fetch("/api/earn/vaultInfo", {
    headers: {
      vaultId,
      network,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  const { data } = await res.json();
  return data as VaultInfoResponse;
};

export const useVaultInfo = ({ vaultId }: UseEarnProps): UseEarnReturn => {
  const {
    data: vaultInfo,
    error,
    isLoading,
  } = useSWR(
    vaultId ? ["vault-info", vaultId] : null,
    () => fetchVaultInfo(vaultId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min
    },
  );

  return {
    vaultInfo: vaultInfo || null,
    isLoading,
    isError: Boolean(error),
  };
};
