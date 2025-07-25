"use client";

import { useUserContext } from "@/contexts";
import { useUserPoolPositions } from "@/features/pools/hooks/useUserPoolPositions";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { ConnectWallet } from "@/shared/components/buttons";
import { TheTable } from "@/shared/components";
import { UserPosition } from "@soroswap/sdk";
import { ColumnDef } from "@tanstack/react-table";
import { TokenIcon } from "@/shared/components";
import { useState } from "react";
import { UserPoolModal } from "@/features/pools/components";

export const UserLiquidity = () => {
  const { address } = useUserContext();
  const { tokenMap } = useTokensList();
  const { positions: userPositions, isLoading: positionsLoading } =
    useUserPoolPositions(address);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rowData, setRowData] = useState<UserPosition | null>(null);

  const handleRowClick = (position: UserPosition) => {
    console.log("Row clicked:", position);
    setIsModalOpen(true);
    setRowData(position);
  };

  const columns: ColumnDef<UserPosition, unknown>[] = [
    {
      id: "pair",
      header: "Pool",
      cell: ({ row }) => {
        const pool = row.original;

        if (!pool.poolInfo.tokenA || !pool.poolInfo.tokenB) {
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
            <span className="text-primary font-semibold">
              {displayTokenA}/{displayTokenB}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "userPosition",
      header: () => (
        <span className="text-primary flex justify-end font-semibold">
          Position
        </span>
      ),
      cell: ({ row }) => {
        const pool = row.original;
        return (
          <span className="text-primary flex justify-end font-semibold">
            {pool.userPosition ? (
              pool.userPosition.toString()
            ) : (
              <div className="skeleton h-4 w-16" />
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "tvl",
      header: () => (
        <span className="text-primary flex justify-end font-semibold">TVL</span>
      ),
      cell: () => {
        // const pool = row.original;
        return (
          <span className="text-primary flex justify-end font-semibold">
            <div className="skeleton h-4 w-12" />
          </span> //TODO: Calculate TVL correctly
        );
      },
    },
  ];

  return (
    <section className="mb-10">
      <h2 className="text-primary mb-4 text-lg font-semibold">
        Your liquidity
      </h2>
      <div>
        {/* Wallet not connected */}
        {!address && (
          <div className="border-surface-hover bg-surface-alt flex flex-col items-center gap-4 rounded-2xl border p-6 text-center">
            <p className="text-secondary text-sm">
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
            <p className="text-secondary text-sm">
              You don&apos;t have liquidity positions yet.
            </p>
          )}

        {/* Positions list */}
        {address &&
          userPositions &&
          userPositions.length > 0 &&
          !positionsLoading && (
            <TheTable
              columns={columns}
              data={userPositions}
              enableRowSelection={true}
              onRowClick={handleRowClick}
            />
          )}
      </div>
      {isModalOpen && rowData && (
        <UserPoolModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          rowData={rowData}
        />
      )}
    </section>
  );
};
