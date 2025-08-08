"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TheTable } from "@/shared/components/TheTable";
import { VaultInfoResponse } from "@defindex/sdk";
import { useVaultInfo } from "@/features/earn/hooks";
import { useRouter } from "next/navigation";

const createColumns = (): ColumnDef<VaultInfoResponse>[] => [
  {
    accessorKey: "vault",
    header: "Vault",
    cell: ({ row }) => {
      const vault = row.original;
      return (
        <div className="flex w-full items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500" />
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
      return <div className="text-primary">APY %</div>;
    },
  },
  {
    accessorKey: "riskLevel",
    header: "Risk Level",
    cell: () => {
      return <div className="text-primary">Low</div>;
    },
  },
  {
    accessorKey: "holding",
    header: "Holdings",
    cell: ({ row }) => {
      const vault = row.original;

      if (!vault.address) {
        return <div className="text-primary">Connect wallet</div>;
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

export function VaultTable() {
  const router = useRouter();
  const vaultmock = [
    "CAIZ3NMNPEN5SQISJV7PD2YY6NI6DIPFA4PCRUBOGDE4I7A3DXDLK5OI",
    "CBNKCU3HGFKHFOF7JTGXQCNKE3G3DXS5RDBQUKQMIIECYKXPIOUGB2S3",
    "CDRSZ4OGRVUU5ONTI6C6UNF5QFJ3OGGQCNTC5UXXTZQFVRTILJFSVG5D",
  ];

  const { vaultInfos, isLoading } = useVaultInfo({
    vaultIds: vaultmock,
  });

  const columns = createColumns();

  return (
    <div className="max-h-96 overflow-y-auto">
      <TheTable
        columns={columns}
        data={vaultInfos}
        isLoading={isLoading}
        emptyLabel="No vaults available"
        className="w-full"
        onRowClick={(row) => {
          router.push(`/earn/${vaultmock[0]}`);
        }}
      />
    </div>
  );
}
