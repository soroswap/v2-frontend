"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TheTable } from "@/shared/components/TheTable";
import { VaultInfoResponse } from "@defindex/sdk";
import { useVaultInfo } from "@/features/earn/hooks";
import { useRouter } from "next/navigation";
import { TokenIcon } from "@/shared/components/TokenIcon";
import { useTokensList } from "@/shared/hooks";
import { useVaultBalance } from "@/features/earn/hooks/useVaultBalance";
import { useUserContext } from "@/contexts";
import { formatCurrency } from "@/shared/lib/utils/formatCurrency";
import { TheButton } from "@/shared/components";
import { formatUnits } from "@/shared/lib/utils";
import { VAULT_MOCK } from "../constants/vault";
import { ProgressBar } from "./ProgressBar";
import { RiskLevel } from "../types/RiskLevel";

type VaultTableData = VaultInfoResponse & {
  vaultAddress: string;
  riskLevel: RiskLevel;
};

export const VaultTable = () => {
  const { address } = useUserContext();
  const router = useRouter();
  const { connectWallet } = useUserContext();

  const { vaultInfos, isLoading } = useVaultInfo({
    vaultIds: VAULT_MOCK.map((item) => item.vaultAddress),
  });

  const { vaultBalances } = useVaultBalance({
    vaultIds: VAULT_MOCK.map((item) => item.vaultAddress),
    userAddress: address,
  });

  const vaultTableData: VaultTableData[] = vaultInfos.map(
    (vaultInfo, index) => ({
      ...vaultInfo,
      vaultAddress: VAULT_MOCK[index]?.vaultAddress || "",
      riskLevel: VAULT_MOCK[index]?.riskLevel || "low",
    }),
  );

  const tokenMap = useTokensList();

  const columns: ColumnDef<VaultTableData>[] = [
    {
      accessorKey: "vault",
      header: "Vault",
      cell: ({ row }) => {
        const vault = row.original;
        return (
          <div className="flex w-full items-center gap-3">
            <TokenIcon
              src={tokenMap.tokenMap[vault.assets[0].address]?.icon}
              name={vault.name}
              code={vault.assets[0].symbol}
            />
            <div className="flex flex-col">
              <p className="text-primary font-medium">{vault.name}</p>
              <p className="text-primary text-xs font-medium">{vault.symbol}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "estApy",
      header: "Est APY",
      cell: ({ row }) => {
        const vault = row.original;
        return <div className="text-primary">{vault.apy.toFixed(2)} %</div>;
      },
    },
    {
      accessorKey: "riskLevel",
      header: "Risk Level",
      cell: ({ row }) => {
        const vault = row.original;

        return (
          <div className="text-primary w-[50%]">
            <ProgressBar level={vault.riskLevel} />
          </div>
        );
      },
    },
    {
      accessorKey: "holding",
      header: "Holdings",
      cell: ({ row }) => {
        const vault = row.original;
        const vaultBalance = vaultBalances?.[vault.vaultAddress];

        if (!address) {
          return (
            <div className="text-primary z-40 w-32">
              <TheButton
                onClick={(e) => {
                  e.preventDefault(), e.stopPropagation(), connectWallet();
                }}
                className="h-8 w-24 p-3 text-xs font-medium"
              >
                Connect
              </TheButton>
            </div>
          );
        }

        if (!vaultBalance) {
          return (
            <div className="border-surface-page bg-surface-alt text-primary skeleton w-[50%] rounded-lg border p-2" />
          );
        }

        return (
          <div className="text-primary">
            {vaultBalance.underlyingBalance[0]} {vault.assets[0].symbol}
          </div>
        );
      },
    },
    {
      accessorKey: "tvl",
      header: "TVL",
      cell: ({ row }) => {
        const vault = row.original;
        const tvl = vault.totalManagedFunds?.[0]?.total_amount;

        // Validate tvl before converting to BigInt
        if (!tvl || tvl === "0" || tvl === 0) {
          return (
            <div className="text-primary font-medium">
              {formatCurrency("0")}
            </div>
          );
        }

        return (
          <div className="text-primary font-medium">
            {formatCurrency(formatUnits({ value: BigInt(tvl), decimals: 7 }))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="[&_tbody_tr]:!h-[84px] [&_tbody_tr]:!min-h-[84px] [&_tbody_tr_td]:!h-[84px]">
          <TheTable
            columns={columns}
            data={vaultTableData}
            isLoading={isLoading}
            emptyLabel="No vaults available"
            className="w-full"
            onRowClick={(vault) => {
              router.push(`/earn/${vault.vaultAddress}`);
            }}
          />
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {isLoading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : vaultTableData.length === 0 ? (
          <div className="py-8 text-center">No vaults available</div>
        ) : (
          vaultTableData.map((vault) => {
            const tvl = vault.totalManagedFunds?.[0]?.total_amount;

            return (
              <div
                key={vault.vaultAddress}
                className="bg-surface border-surface-alt hover:bg-surface-alt/50 flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors"
                onClick={() => router.push(`/earn/${vault.vaultAddress}`)}
              >
                {/* Header with icon and title */}
                <div className="flex flex-col items-center gap-3">
                  <TokenIcon
                    src={tokenMap.tokenMap[vault.assets[0].address]?.icon}
                    name={vault.name}
                    code={vault.assets[0].symbol}
                  />
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-primary flex font-medium">
                      {vault.name}
                    </p>
                    <p className="text-primary flex text-xs font-medium">
                      {vault.symbol}
                    </p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Est APY */}
                  <div className="flex flex-col text-center">
                    <p className="text-secondary text-md">Est APY</p>
                    <p className="text-primary flex h-full items-center justify-center text-sm font-medium">
                      {vault.apy.toFixed(2)} %
                    </p>
                  </div>

                  {/* Risk Level */}
                  <div className="flex flex-col text-center">
                    <p className="text-secondary text-md">Risk Level</p>
                    <div className="flex h-full items-center justify-center">
                      <ProgressBar level={vault.riskLevel} />
                    </div>
                  </div>

                  {/* TVL */}
                  <div className="flex flex-col text-center">
                    <p className="text-secondary text-md">TVL</p>
                    <p className="text-primary flex h-full items-center justify-center text-sm font-medium text-nowrap">
                      {formatCurrency(
                        formatUnits({ value: BigInt(tvl), decimals: 7 }),
                      )}
                    </p>
                  </div>
                </div>

                {/* Holdings Row */}
                <div className="border-surface-alt border-t">
                  <div className="flex flex-col gap-3 text-center">
                    <p className="text-secondary text-md">Holdings</p>
                    {!address ? (
                      <div className="text-primary mx-auto w-fit">
                        <TheButton
                          onClick={(e) => {
                            e.preventDefault(),
                              e.stopPropagation(),
                              connectWallet();
                          }}
                          className="h-8 w-32 p-3 text-xs font-medium text-white"
                        >
                          Connect Wallet
                        </TheButton>
                      </div>
                    ) : (
                      <p className="text-primary text-sm">
                        {vaultBalances?.[vault.vaultAddress]?.dfTokens || 0}{" "}
                        {vault.assets[0].symbol}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
