import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { usePools } from "@/features/pools/hooks/usePools";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { TheTable } from "@/shared/components";
import { Pool } from "@soroswap/sdk";

export const SoroSwapAllLiquidityPools = () => {
  const { pools, isLoading } = usePools();
  const { tokenCodeMap } = useTokensList();

  // Define table columns
  const columns: ColumnDef<Pool, unknown>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => row.index + 1,
      size: 40,
    },
    {
      id: "pair",
      header: "Pool",
      accessorFn: (row) => `${row.tokenA}/${row.tokenB}`,
      cell: ({ row }) => {
        const pool = row.original;
        return (
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={
                  tokenCodeMap[pool.tokenA.toUpperCase()]?.icon || "/globe.svg"
                }
                alt={pool.tokenA}
                width={24}
                height={24}
                className="rounded-full border border-white bg-white"
              />
              <Image
                src={
                  tokenCodeMap[pool.tokenB.toUpperCase()]?.icon || "/globe.svg"
                }
                alt={pool.tokenB}
                width={24}
                height={24}
                className="absolute top-0 left-3 rounded-full border border-white bg-white"
              />
            </div>
            <span className="font-semibold text-white">
              {pool.tokenA}/{pool.tokenB}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "reserveA",
      header: "TVL",
      cell: ({ getValue }) => {
        const value = getValue<bigint>();
        return <span>{value.toString()}</span>;
      },
    },
    {
      accessorKey: "totalFeeBps",
      header: "APR",
      cell: ({ getValue }) => `${getValue<number>()}%`,
    },
  ];

  return (
    <section className="max-h-[500px] overflow-y-auto">
      <h2 className="sr-only">All pools</h2>

      <TheTable
        data={pools}
        columns={columns}
        isLoading={isLoading}
        variant="default"
      />
    </section>
  );
};
