"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TokenIcon } from "@/shared/components/TokenIcon";
import { CopyAndPasteButton } from "@/shared/components";
import { formatCurrency } from "@/shared/lib/utils/formatCurrency";
import { useVaultBalance, useVaultInfo } from "../hooks";
import { useUserContext } from "@/contexts/UserContext";
import { useTokensList } from "@/shared/hooks";

export const VaultCardDetails = ({
  vaultAddress,
}: {
  vaultAddress: string;
}) => {
  const router = useRouter();
  const { tokenMap } = useTokensList();
  const { address: userAddress } = useUserContext();
  const { vaultInfo, isLoading: isVaultInfoLoading } = useVaultInfo({
    vaultId: vaultAddress,
  });
  const { vaultBalance } = useVaultBalance({
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
    <div className="bg-surface border-surface-alt flex flex-col gap-4 rounded-2xl border p-8 shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="hover:bg-surface-hover flex cursor-pointer items-center justify-center rounded-lg p-2 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="text-primary size-6" />
        </button>
        <p className="text-secondary text-sm font-medium">Back</p>
      </div>
      <div className="flex items-center gap-4">
        <TokenIcon
          src={tokenMap[vaultInfo.assets[0].address]?.icon}
          name={vaultInfo.name}
          code={vaultInfo.assets[0].symbol}
          size={64}
          className="bg-orange-500"
        />
        <div>
          <h3 className="text-primary text-2xl font-bold">{vaultInfo.name}</h3>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Est APY */}
        <div className="flex flex-col gap-4">
          <p className="text-primary text-lg font-bold">EST APY</p>
        </div>
        {/* Risk Level */}
        <div className="flex flex-col">
          <p className="text-secondary text-sm font-medium">Risk Level</p>
          <div>
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
          <span className="text-primary text-lg font-bold">
            {vaultBalance?.underlyingBalance[0] || "Connect wallet"}
          </span>
        </div>
        {/* Deposits */}
        <div className="flex flex-col">
          <span className="text-secondary mb-2 text-sm font-medium">
            Deposits
          </span>
          <span className="text-primary text-lg font-bold">
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
