"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TokenIcon } from "@/shared/components/TokenIcon";
import { CopyAndPasteButton, TheButton } from "@/shared/components";
import { formatCurrency } from "@/shared/lib/utils/formatCurrency";
import { useVaultBalance, useVaultInfo } from "@/features/earn/hooks";
import { useUserContext } from "@/contexts/UserContext";
import { useTokensList } from "@/shared/hooks";
import { ProgressBar } from "@/features/earn/components/ProgressBar";
import { VAULT_MOCK } from "@/features/earn/constants/vault";
import { formatUnits } from "@/shared/lib/utils";

const VaultCardDetailsLoading = () => {
  return (
    <div className="bg-surface border-surface-alt flex animate-pulse flex-col gap-4 rounded-2xl border p-8 shadow-lg">
      {/* Back button - matches real height */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-gray-300" />
        <div className="h-4 w-12 rounded bg-gray-300" />
      </div>

      {/* Vault header - matches real height */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-300" />
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 rounded bg-gray-300" />
        </div>
      </div>

      {/* Metrics grid - matches real height with proper spacing */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* EST APY */}
        <div className="flex flex-col gap-4">
          <div className="h-7 w-20 rounded bg-gray-300" />
          <div className="h-7 w-16 rounded bg-gray-300" />
        </div>

        {/* Risk Level */}
        {/* <div className="flex flex-col gap-2">
          <div className="h-5 w-20 rounded bg-gray-300" />
          <div className="h-6 w-24 rounded bg-gray-300" />
        </div> */}

        {/* Holdings */}
        <div className="flex flex-col gap-2">
          <div className="h-5 w-16 rounded bg-gray-300" />
          <div className="h-8 w-32 rounded-lg bg-gray-300" />
        </div>

        {/* Deposits */}
        <div className="flex flex-col gap-2">
          <div className="h-5 w-16 rounded bg-gray-300" />
          <div className="h-7 w-24 rounded bg-gray-300" />
        </div>
      </div>

      {/* Vault contract address - matches real height */}
      <div className="sm:bg-surface-subtle flex items-center justify-between rounded-lg p-0 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="hidden h-5 w-32 rounded bg-gray-300 sm:flex" />
          <div className="hidden h-5 w-64 rounded bg-gray-300 sm:flex" />
          <div className="flex h-5 w-40 rounded bg-gray-300 sm:hidden" />
        </div>
        <div className="h-8 w-8 rounded bg-gray-300" />
      </div>
    </div>
  );
};

export const VaultCardDetails = ({
  vaultAddress,
}: {
  vaultAddress: string;
}) => {
  const router = useRouter();
  const { tokenMap } = useTokensList();
  const { address: userAddress, connectWallet } = useUserContext();
  const { vaultInfo, isLoading: isVaultInfoLoading } = useVaultInfo({
    vaultId: vaultAddress,
  });
  const { vaultBalance, isLoading: isVaultBalanceLoading } = useVaultBalance({
    vaultId: vaultAddress,
    userAddress,
  });

  const riskLevelByVaultAddress = VAULT_MOCK.find(
    (item) => item.vaultAddress === vaultAddress,
  );

  if (isVaultInfoLoading) {
    return <VaultCardDetailsLoading />;
  }

  if (!vaultInfo) return;

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
        />
        <div>
          <h3 className="text-primary text-2xl font-bold">{vaultInfo.name}</h3>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Est APY */}
        <div className="flex flex-col gap-4">
          <p className="text-secondary flex h-full text-sm font-medium">
            EST APY
          </p>
          <div className="flex h-full items-center">
            <p className="text-primary text-lg font-semibold">
              {vaultInfo.apy.toFixed(2)}%
            </p>
          </div>
        </div>
        {/* Risk Level */}
        {/* <div className="flex flex-col gap-2">
          <p className="text-secondary flex h-full text-sm font-medium">
            Risk Level
          </p>
          <div className="flex h-full items-center">
            <ProgressBar level={riskLevelByVaultAddress?.riskLevel} />
          </div>
        </div> */}
        {/* Holdings */}
        <div className="flex flex-col gap-2">
          <p className="text-secondary text-sm font-medium">Holdings</p>
          {isVaultInfoLoading || isVaultBalanceLoading ? (
            <div className="flex h-full items-center">
              <div className="skeleton h-8 w-24" />
            </div>
          ) : userAddress && vaultBalance && vaultInfo ? (
            <div className="flex h-full items-center">
              <p className="text-primary w-fit text-lg font-semibold sm:px-3 sm:py-1">
                {Number(
                  formatUnits({
                    value: vaultBalance?.underlyingBalance[0],
                    decimals: 7,
                  }),
                )}{" "}
                {vaultInfo.assets[0].symbol}
              </p>
            </div>
          ) : (
            <div className="flex h-full items-center">
              <TheButton
                onClick={() => {
                  connectWallet();
                }}
                className="h-8 w-24 p-3 text-xs font-medium text-white"
              >
                Connect
              </TheButton>
            </div>
          )}
        </div>
        {/* Deposits */}
        <div className="flex flex-col">
          <p className="text-secondary text-sm font-medium">Deposits</p>
          <div className="flex h-full items-center">
            <p className="text-primary text-lg font-semibold">
              {formatCurrency(
                formatUnits({
                  value: BigInt(vaultInfo.totalManagedFunds?.[0]?.total_amount),
                  decimals: 7,
                }),
                vaultInfo.assets[0].symbol,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Vault contract address */}
      <div className="sm:bg-surface-subtle flex items-center justify-between rounded-lg p-0 sm:p-4">
        <div className="flex items-center gap-3">
          <p className="text-secondary hidden text-sm font-medium sm:flex">
            Vault Contract Address
          </p>
          <p className="text-primary hidden font-mono text-sm sm:flex">
            {vaultAddress}
          </p>
          <p className="text-primary flex font-mono text-sm sm:hidden">
            {vaultAddress.slice(0, 19)}...{vaultAddress.slice(-8)}
          </p>
        </div>
        <CopyAndPasteButton
          textToCopy={vaultAddress}
          className="sm:bg-surface-subtle bg-transparent"
        />
      </div>
    </div>
  );
};
