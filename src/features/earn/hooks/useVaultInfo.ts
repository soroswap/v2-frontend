import useSWR from "swr";
import { network } from "@/shared/lib/environmentVars";
import { VaultInfoResponse } from "@defindex/sdk";

interface UseEarnProps {
  vaultId?: string | null;
  vaultIds?: string[];
}

interface UseEarnReturn {
  vaultInfo: VaultInfoResponse | null;
  vaultInfos: VaultInfoResponse[];
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

const fetchMultipleVaultInfos = async (
  vaultIds: string[],
): Promise<VaultInfoResponse[]> => {
  const promises = vaultIds.map((vaultId) => fetchVaultInfo(vaultId));
  return Promise.all(promises);
};

export const useVaultInfo = ({
  vaultId,
  vaultIds,
}: UseEarnProps): UseEarnReturn => {
  const {
    data: singleVaultInfo,
    error: singleError,
    isLoading: singleLoading,
  } = useSWR(
    vaultId ? ["vault-info", vaultId] : null,
    () => fetchVaultInfo(vaultId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min
    },
  );

  const {
    data: multipleVaultInfos,
    error: multipleError,
    isLoading: multipleLoading,
  } = useSWR(
    vaultIds && vaultIds.length > 0
      ? ["vault-infos", vaultIds.join(",")]
      : null,
    () => fetchMultipleVaultInfos(vaultIds!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 min
    },
  );

  return {
    vaultInfo: singleVaultInfo || null,
    vaultInfos: multipleVaultInfos || [],
    isLoading: singleLoading || multipleLoading,
    isError: Boolean(singleError || multipleError),
  };
};
