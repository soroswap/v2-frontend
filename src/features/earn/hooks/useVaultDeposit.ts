import { useState } from "react";
import { network } from "@/shared/lib/environmentVars";
import { parseUnits } from "@/shared/lib/utils";
import { VaultTransactionResponse } from "@defindex/sdk";

interface DepositParams {
  vaultAddress: string;
  amount: string;
  decimals: number;
  caller: string;
  slippageBps: number;
}

interface UseVaultDepositReturn {
  deposit: (params: DepositParams) => Promise<VaultTransactionResponse>;
  isLoading: boolean;
  error: string | null;
}

export const useVaultDeposit = (): UseVaultDepositReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = async (
    params: DepositParams,
  ): Promise<VaultTransactionResponse> => {
    const { vaultAddress, amount, decimals, caller, slippageBps } = params;

    setIsLoading(true);
    setError(null);

    try {
      const parsedAmount = parseUnits({
        value: amount,
        decimals,
      }).toString();

      const response = await fetch("/api/earn/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vaultId: vaultAddress,
          amount: parsedAmount,
          caller,
          slippageBps,
          network,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Deposit failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      setError(error as string);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deposit,
    isLoading,
    error,
  };
};
