import { ColumnDef } from "@tanstack/react-table";
import { usePools } from "@/features/pools/hooks/usePools";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { TheTable } from "@/shared/components";
import { Pool } from "@soroswap/sdk";
import { ArrowUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { TokenIcon } from "@/shared/components";
import { useRouter } from "next/navigation";

export const SoroSwapAllLiquidityPools = () => {
  const { pools, isLoading } = usePools();
  const { tokenMap } = useTokensList();
  const router = useRouter();

  // Define table columns
  const columns: ColumnDef<Pool, unknown>[] = [
    {
      id: "pair",
      header: "Pool",
      accessorFn: (row) => `${row.tokenA}/${row.tokenB}`,
      cell: ({ row }) => {
        const pool = row.original;

        const tokenAData = tokenMap[pool.tokenA];
        const tokenBData = tokenMap[pool.tokenB];

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
                src={tokenAData?.icon}
                alt={pool.tokenA}
                className="rounded-full border border-white bg-white"
              />
              <TokenIcon
                src={tokenBData?.icon}
                alt={pool.tokenB}
                className="absolute top-0 left-3 rounded-full border border-white bg-white"
              />
            </div>
            <p className="text-primary font-semibold">
              {tokenAData?.code}/{tokenBData?.code}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "tvl",
      sortDescFirst: true,
      sortingFn: (rowA, rowB, id) => {
        const a = rowA.getValue(id) as bigint | null | undefined;
        const b = rowB.getValue(id) as bigint | null | undefined;
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        return a < b ? -1 : a > b ? 1 : 0;
      },
      header: ({ column }) => (
        <div className="flex items-center justify-end gap-2">
          <p className="text-primary">TVL</p>
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
          <p className="flex justify-end">
            {typeof value === "bigint" ? (
              value.toString()
            ) : (
              <span className="skeleton h-4 w-16" />
            )}
          </p>
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
        onRowClick={(row) => {
          router.push(`/pools/add-liquidity/${row.tokenA}/${row.tokenB}`);
        }}
        enableRowSelection={true}
        initialSorting={[{ id: "tvl", desc: true }]}
      />
    </section>
  );
};
