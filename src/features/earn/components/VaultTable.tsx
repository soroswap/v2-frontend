"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TheTable } from "@/shared/components/TheTable";
import { VaultInfoResponse } from "@defindex/sdk";

export interface VaultData {
  id: string;
  name: string;
  description: string;
  estApy: string;
  histApy: string;
  riskLevel: number;
  available: string;
  holding: string;
  tvl: string;
  icon: string;
}

interface VaultTableProps {
  vaultInfo?: VaultInfoResponse;
  mockData?: VaultData[];
  isLoading?: boolean;
}

const columns: ColumnDef<VaultInfoResponse>[] = [
  {
    accessorKey: "vault",
    header: "Vault",
    cell: ({ row }) => {
      const vault = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
            <span className="text-sm font-bold text-white">{vault.symbol}</span>
          </div>
          <div>
            <p className="text-primary font-medium">{vault.name}</p>
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
      return <div className="text-primary">{vault.totalSupply}</div>;
    },
  },
  {
    accessorKey: "histApy",
    header: "Hist APY",
    cell: ({ row }) => {
      const vault = row.original;
      return <div className="text-primary">{vault.feesBps.vaultFee}</div>;
    },
  },
  {
    accessorKey: "riskLevel",
    header: "Risk Level",
    cell: ({ row }) => {
      const vault = row.original;
      return (
        <div className="flex items-center">
          <div className="bg-surface-alt h-2 w-full rounded-full">
            <div
              className="bg-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${vault.feesBps.vaultFee}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "available",
    header: "Available",
    cell: ({ row }) => {
      const vault = row.original;
      return <div className="text-primary">{vault.totalSupply}</div>;
    },
  },
  {
    accessorKey: "holding",
    header: "Holding",
    cell: ({ row }) => {
      const vault = row.original;
      return <div className="text-primary">{vault.totalSupply}</div>;
    },
  },
  {
    accessorKey: "tvl",
    header: "TVL",
    cell: ({ row }) => {
      const vault = row.original;
      return (
        <div className="text-primary font-medium">{vault.totalAssets}</div>
      );
    },
  },
];

export function VaultTable({
  vaultInfo,
  mockData,
  isLoading,
}: VaultTableProps) {
  return (
    <div className="max-h-96 overflow-y-auto">
      <TheTable
        columns={columns}
        data={vaultInfo ? [vaultInfo] : []}
        isLoading={isLoading}
        emptyLabel="No vaults available"
        className="w-full"
      />
    </div>
  );
}
