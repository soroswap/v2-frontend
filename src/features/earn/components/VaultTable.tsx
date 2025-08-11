"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TheTable } from "@/shared/components/TheTable";
import { VaultInfoResponse } from "@defindex/sdk";
import { useVaultInfo } from "@/features/earn/hooks";
import { useRouter } from "next/navigation";
import { TokenIcon } from "@/shared/components/TokenIcon";
import { useTokensList } from "@/shared/hooks";

export const VaultTable = () => {
  const router = useRouter();
  const vaultmock = [
    "CAIZ3NMNPEN5SQISJV7PD2YY6NI6DIPFA4PCRUBOGDE4I7A3DXDLK5OI",
    "CBNKCU3HGFKHFOF7JTGXQCNKE3G3DXS5RDBQUKQMIIECYKXPIOUGB2S3",
    "CDRSZ4OGRVUU5ONTI6C6UNF5QFJ3OGGQCNTC5UXXTZQFVRTILJFSVG5D",
  ];

  const { vaultInfos, isLoading } = useVaultInfo({
    vaultIds: vaultmock,
  });

  const tokenMap = useTokensList();

  const columns: ColumnDef<VaultInfoResponse>[] = [
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
        return <div className="text-primary">APY %</div>;
      },
    },
    {
      accessorKey: "riskLevel",
      header: "Risk Level",
      cell: ({ row }) => {
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

        if (!vault.address) {
          return (
            <div className="border-surface-page bg-surface-alt text-primary w-fit rounded-lg border p-2">
              Connect wallet
            </div>
          );
        }

        return <div className="text-primary">{vault.address}</div>;
      },
    },
    {
      accessorKey: "tvl",
      header: "TVL",
      cell: ({ row }) => {
        const vault = row.original;
        const tvl = vault.totalManagedFunds?.[0]?.total_amount || "0";
        return <div className="text-primary font-medium">{tvl}</div>;
      },
    },
  ];

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <TheTable
          columns={columns}
          data={vaultInfos}
          isLoading={isLoading}
          emptyLabel="No vaults available"
          className="w-full"
          onRowClick={(vault) => {
            router.push(`/earn/${vaultmock[0]}`);
          }}
        />
      </div>

      {/* Mobile Cards */}
      <div className="space-y-4 md:hidden">
        {isLoading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : vaultInfos.length === 0 ? (
          <div className="py-8 text-center">No vaults available</div>
        ) : (
          vaultInfos.map((vault, index) => {
            const tvl = vault.totalManagedFunds?.[0]?.total_amount || "0";

            return (
              <div
                key={vault.address || index}
                className="bg-surface border-surface-alt hover:bg-surface-alt/50 cursor-pointer rounded-xl border p-4 transition-colors"
                onClick={() => router.push(`/earn/${vaultmock[0]}`)}
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
                    <p className="text-primary font-medium">APY %</p>
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
                    {!vault.address ? (
                      <div className="border-surface-page bg-surface-alt text-primary mx-auto w-fit rounded-lg border px-3 py-1 text-sm">
                        Connect wallet
                      </div>
                    ) : (
                      <p className="text-primary text-sm">{vault.address}</p>
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
