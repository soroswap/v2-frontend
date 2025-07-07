"use client";

import { useUserContext } from "@/contexts";
import { useUserPoolPositions } from "@/features/pools/hooks/useUserPoolPositions";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { ConnectWallet } from "@/shared/components/buttons";
import { TheTable } from "@/shared/components";
import { UserPosition } from "@soroswap/sdk";
import { ColumnDef } from "@tanstack/react-table";
import { TokenIcon } from "@/shared/components";

export const UserLiquidity = () => {
  const { address } = useUserContext();
  const { tokenMap } = useTokensList();
  const { positions: userPositions, isLoading: positionsLoading } =
    useUserPoolPositions(address);

  const columns: ColumnDef<UserPosition, unknown>[] = [
    {
      id: "pair",
      header: "Pool",
      cell: ({ row }) => {
        const pool = row.original;

        // Convert contract addresses to human-readable token codes when possible
        const displayTokenA =
          tokenMap[pool.poolInfo.tokenA]?.code ??
          pool.poolInfo.tokenA.slice(0, 4);
        const displayTokenB =
          tokenMap[pool.poolInfo.tokenB]?.code ??
          pool.poolInfo.tokenB.slice(0, 4);

        return (
          <div className="flex items-center gap-4">
            <div className="relative">
              <TokenIcon
                src={tokenMap[pool.poolInfo.tokenA]?.icon}
                alt={displayTokenA}
                className="rounded-full border border-white bg-white"
              />
              <TokenIcon
                src={tokenMap[pool.poolInfo.tokenB]?.icon}
                alt={displayTokenB}
                className="absolute top-0 left-3 rounded-full border border-white bg-white"
              />
            </div>
            <span className="font-semibold text-white">
              {displayTokenA}/{displayTokenB}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "userPosition",
      header: () => (
        <span className="flex justify-end font-semibold text-white">
          Position
        </span>
      ),
      cell: ({ row }) => {
        const pool = row.original;
        return (
          <span className="flex justify-end font-semibold text-white">
            {pool.userPosition}
          </span>
        );
      },
    },
    {
      accessorKey: "tvl",
      header: () => (
        <span className="flex justify-end font-semibold text-white">TVL</span>
      ),
      cell: ({ row }) => {
        // const pool = row.original;
        return (
          <span className="flex justify-end font-semibold text-white">tvl</span>
        );
      },
    },
  ];

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-white">Your liquidity</h2>
      <div>
        {/* Wallet not connected */}
        {!address && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#23243a] bg-[#10121A]/70 p-6 text-center">
            <p className="text-sm text-[#A0A3C4]">
              Connect to a wallet to view your liquidity.
            </p>
            <ConnectWallet className="w-full max-w-xs items-center justify-center" />
          </div>
        )}
        {/* Loading positions */}
        {address && positionsLoading && (
          <div
            className="skeleton h-24 w-full"
            aria-label="Loading positions"
          />
        )}
        {/* No positions */}
        {address &&
          !positionsLoading &&
          (!userPositions || userPositions.length === 0) && (
            <p className="text-sm text-[#A0A3C4]">
              You don&apos;t have liquidity positions yet.
            </p>
          )}

        {/* Positions list */}
        {address &&
          userPositions &&
          userPositions.length > 0 &&
          !positionsLoading && (
            <TheTable columns={columns} data={userPositions} />
          )}
      </div>
    </section>
  );
};
