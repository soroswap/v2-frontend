import { ColumnDef } from "@tanstack/react-table";
import { usePools } from "@/features/pools/hooks/usePools";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { TheTable } from "@/shared/components";
import { Pool } from "@soroswap/sdk";
import { ArrowUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { TokenIcon } from "@/shared/components";

export const SoroSwapAllLiquidityPools = () => {
  const { pools, isLoading } = usePools();
  const { tokenCodeMap } = useTokensList();

  // Define table columns
  const columns: ColumnDef<Pool, unknown>[] = [
    {
      id: "pair",
      header: "Pool",
      accessorFn: (row) => `${row.tokenA}/${row.tokenB}`,
      cell: ({ row }) => {
        const pool = row.original;

        if (!pool.tokenA || !pool.tokenB) {
          return (
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="skeleton size-8 rounded-full" />
                <div className="skeleton absolute top-0 left-3 size-8 rounded-full" />
              </div>
              <div className="skeleton h-4 w-24" />
            </div>
          );
        }

        return (
          <div className="flex items-center gap-4">
            <div className="relative">
              <TokenIcon
                src={tokenCodeMap[pool.tokenA.toUpperCase()]?.icon}
                alt={pool.tokenA}
                className="rounded-full border border-white bg-white"
              />
              <TokenIcon
                src={tokenCodeMap[pool.tokenB.toUpperCase()]?.icon}
                alt={pool.tokenB}
                className="absolute top-0 left-3 rounded-full border border-white bg-white"
              />
            </div>
            <span className="text-primary font-semibold">
              {pool.tokenA}/{pool.tokenB}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "tvl",
      header: ({ column }) => (
        <div className="flex items-center justify-end gap-2">
          <span className="text-primary">TVL</span>
          <ArrowUp
            className={cn(
              "text-primary size-4 cursor-pointer transition-transform duration-300",
              column.getIsSorted() === "asc" && "text-brand rotate-0",
              column.getIsSorted() === "desc" && "text-brand rotate-180",
              column.getIsSorted() === false && "text-primary opacity-40",
            )}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        </div>
      ),
      cell: ({ getValue }) => {
        const value = getValue<bigint>();
        return (
          <span className="flex justify-end">
            {value ? value.toString() : <div className="skeleton h-4 w-16" />}
          </span>
        );
      },
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">All pools</h2>

      <TheTable
        data={pools}
        columns={columns}
        isLoading={isLoading}
        variant="default"
      />
    </section>
  );
};
