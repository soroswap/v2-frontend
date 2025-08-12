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

type VaultTableData = VaultInfoResponse & {
  vaultAddress: string;
  riskLevel: string;
};

export const VaultTable = () => {
  const { address } = useUserContext();
  const router = useRouter();

  const vaultmock: { vaultAddress: string; riskLevel: string }[] = [
    {
      vaultAddress: "CAIZ3NMNPEN5SQISJV7PD2YY6NI6DIPFA4PCRUBOGDE4I7A3DXDLK5OI",
      riskLevel: "low",
    },
    {
      vaultAddress: "CBNKCU3HGFKHFOF7JTGXQCNKE3G3DXS5RDBQUKQMIIECYKXPIOUGB2S3",
      riskLevel: "medium",
    },
    {
      vaultAddress: "CDRSZ4OGRVUU5ONTI6C6UNF5QFJ3OGGQCNTC5UXXTZQFVRTILJFSVG5D",
      riskLevel: "high",
    },
  ];

  const { vaultInfos, isLoading } = useVaultInfo({
    vaultIds: vaultmock.map((item) => item.vaultAddress),
  });

  const { vaultBalances } = useVaultBalance({
    vaultIds: vaultmock.map((item) => item.vaultAddress),
    userAddress: address,
  });

  const vaultTableData: VaultTableData[] = vaultInfos.map(
    (vaultInfo, index) => ({
      ...vaultInfo,
      vaultAddress: vaultmock[index]?.vaultAddress || "",
      riskLevel: vaultmock[index]?.riskLevel || "low",
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
        // TODO: Separe the risk level 100 % em 3 partes, low - medium - high , com base no vaultmock aqui.
        return (
          <div className="text-primary">
            <div
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${25}%` }}
            />
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
          return <div className="text-primary">Connect wallet</div>;
        }

        if (!vaultBalance) {
          return (
            <div className="border-surface-page bg-surface-alt text-primary skeleton w-fit rounded-lg border p-2" />
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
        return (
          <div className="text-primary font-medium">{formatCurrency(tvl)}</div>
        );
      },
    },
  ];

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Desktop Table */}
      <div className="hidden md:block">
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
                className="bg-surface border-surface-alt hover:bg-surface-alt/50 cursor-pointer rounded-xl border p-4 transition-colors"
                onClick={() => router.push(`/earn/${vault.vaultAddress}`)}
              >
                {/* Header with icon and title */}
                <div className="mb-4 flex flex-col items-center gap-3">
                  <TokenIcon
                    src={tokenMap.tokenMap[vault.assets[0].address]?.icon}
                    name={vault.name}
                    code={vault.assets[0].symbol}
                  />
                  <div className="flex flex-col">
                    <p className="text-primary font-medium">{vault.name}</p>
                    <p className="text-primary text-xs font-medium">
                      {vault.symbol}
                    </p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Est APY */}
                  <div className="text-center">
                    <p className="text-secondary mb-1 text-sm">Est APY</p>
                    <p className="text-primary font-medium">{vault.apy} %</p>
                  </div>

                  {/* Risk Level */}
                  <div className="text-center">
                    <p className="text-secondary mb-1 text-sm">Risk Level</p>
                    <div className="flex justify-center">
                      <div
                        className="h-2 w-12 rounded-full bg-green-500"
                        style={{ width: `${25}%` }}
                      />
                    </div>
                  </div>

                  {/* TVL */}
                  <div className="text-center">
                    <p className="text-secondary mb-1 text-sm">TVL</p>
                    <p className="text-primary font-medium">{tvl}</p>
                  </div>
                </div>

                {/* Holdings Row */}
                <div className="border-surface-alt mt-4 border-t pt-4">
                  <div className="text-center">
                    <p className="text-secondary mb-1 text-sm">Holdings</p>
                    {!address ? (
                      <div className="border-surface-page bg-surface-alt text-primary mx-auto w-fit rounded-lg border px-3 py-1 text-sm">
                        Connect wallet
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
