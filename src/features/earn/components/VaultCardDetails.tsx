"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TokenIcon } from "@/shared/components/TokenIcon";
import { CopyAndPasteButton } from "@/shared/components";
import { formatCurrency } from "@/shared/lib/utils/formatCurrency";
import { useVaultBalance, useVaultInfo } from "../hooks";
import { useUserContext } from "@/contexts/UserContext";

export const VaultCardDetails = ({
  vaultAddress,
}: {
  vaultAddress: string;
}) => {
  const router = useRouter();
  const { address: userAddress } = useUserContext();
  const { vaultInfo, isLoading: isVaultInfoLoading } = useVaultInfo({
    vaultId: vaultAddress,
  });
  const { vaultBalance, isLoading: isVaultBalanceLoading } = useVaultBalance({
    vaultId: vaultAddress,
    userAddress,
  });

  if (isVaultInfoLoading) {
    return (
      <div className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center">
        <div className="skeleton h-64 w-full max-w-4xl rounded-2xl" />
      </div>
    );
  }

  if (!vaultInfo) {
    return (
      <div className="mt-[100px] flex min-h-[calc(100vh-100px)] items-center justify-center">
        <div className="text-secondary text-center">Vault not found</div>
      </div>
    );
  }

  return (
    <div className="bg-surface border-surface-alt rounded-2xl border p-8 shadow-lg">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="hover:bg-surface-hover flex items-center justify-center rounded-lg p-2 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="text-primary size-6" />
        </button>
        <span className="text-secondary text-sm font-medium">Back</span>
      </div>
      {/* Vault header */}
      <div className="mb-8 flex items-center gap-4">
        <TokenIcon
          name={vaultInfo.name}
          code={vaultInfo.symbol}
          size={64}
          className="bg-orange-500"
        />
        <div>
          <h1 className="text-primary text-2xl font-bold">
            {vaultInfo.name || "Sky Rewards USDS Compounder"}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              C
            </div>
            <div className="flex size-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
              C
            </div>
            <div className="flex size-6 items-center justify-center rounded-full bg-blue-400 text-xs font-bold text-white">
              C
            </div>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
        {/* Est APY */}
        <div className="flex flex-col">
          <span className="text-secondary mb-2 text-sm font-medium">
            Est APY
          </span>
          <span className="text-primary text-2xl font-bold">
            {/* ${vaultInfo.estApy} */}
            ESTAPY
          </span>
        </div>
        {/* Risk Level */}
        <div className="flex flex-col">
          <span className="text-secondary mb-2 text-sm font-medium">
            Risk Level
          </span>
          <div className="mt-2">
            <div className="bg-surface-alt h-2 w-full rounded-full">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${25}%` }}
              />
            </div>
          </div>
        </div>
        {/* Holdings */}
        <div className="flex flex-col">
          <span className="text-secondary mb-2 text-sm font-medium">
            Holdings
          </span>
          <span className="text-primary text-2xl font-bold">
            {vaultBalance?.underlyingBalance[0] || "Connect wallet"}
          </span>
        </div>
        {/* Deposits */}
        <div className="flex flex-col">
          <span className="text-secondary mb-2 text-sm font-medium">
            Deposits
          </span>
          <span className="text-primary text-2xl font-bold">
            {formatCurrency(vaultInfo.totalManagedFunds?.[0]?.total_amount)}
          </span>
        </div>
      </div>

      {/* Vault contract address */}
      <div className="bg-surface-subtle flex items-center justify-between rounded-lg p-4">
        <div className="flex items-center gap-3">
          <span className="text-secondary text-sm font-medium">
            Vault Contract Address
          </span>
          <span className="text-primary font-mono text-sm">{vaultAddress}</span>
        </div>
        <CopyAndPasteButton textToCopy={vaultAddress} />
      </div>
    </div>
  );
};
