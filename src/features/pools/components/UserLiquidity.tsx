"use client";

import { useUserContext } from "@/contexts";
import { useUserPoolPositions } from "@/features/pools/hooks/useUserPoolPositions";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { ConnectWallet } from "@/shared/components/buttons";
import { TheTable } from "@/shared/components";
import { UserPositionResponse } from "@soroswap/sdk";
import { ColumnDef } from "@tanstack/react-table";
import { TokenIcon } from "@/shared/components";
import { useState, useMemo } from "react";
import { UserPoolModal } from "@/features/pools/components";
import { useBatchTokenPrices } from "@/features/swap/hooks/useBatchTokenPrices";
import { calculateIndividualTvl } from "@/shared/lib/utils";

export const UserLiquidity = () => {
  const { address } = useUserContext();
  const { tokenMap } = useTokensList();
  const { positions: userPositions, isLoading: positionsLoading } =
    useUserPoolPositions(address);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [rowData, setRowData] = useState<UserPositionResponse | null>(null);

  // Collect unique token addresses from user positions to get prices
  const tokenAddresses = useMemo(() => {
    if (!userPositions || userPositions.length === 0) return [] as string[];

    const set = new Set<string>();
    userPositions.forEach((position) => {
      if (position.poolInformation.tokenA?.address)
        set.add(position.poolInformation.tokenA.address);
      if (position.poolInformation.tokenB?.address)
        set.add(position.poolInformation.tokenB.address);
    });
    return Array.from(set);
  }, [userPositions]);

  const { priceMap, isLoading: pricesLoading } =
    useBatchTokenPrices(tokenAddresses);

  const handleRowClick = (position: UserPositionResponse) => {
    setIsModalOpen(true);
    setRowData(position);
  };

  const columns: ColumnDef<UserPositionResponse, unknown>[] = [
    {
      id: "pair",
      header: "Pool",
      cell: ({ row }) => {
        const pool = row.original;

        if (!pool.poolInformation.tokenA || !pool.poolInformation.tokenB) {
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
          tokenMap[pool.poolInformation.tokenA.address]?.code ??
          pool.poolInformation.tokenA.address.slice(0, 4);
        const displayTokenB =
          tokenMap[pool.poolInformation.tokenB.address]?.code ??
          pool.poolInformation.tokenB.address.slice(0, 4);

        return (
          <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <TokenIcon
                src={tokenMap[pool.poolInformation.tokenA.address]?.icon}
                alt={displayTokenA}
                className="rounded-full border border-white bg-white"
              />
              <TokenIcon
                src={tokenMap[pool.poolInformation.tokenB.address]?.icon}
                alt={displayTokenB}
                className="absolute top-0 left-3 rounded-full border border-white bg-white"
              />
            </div>
            <span className="text-primary flex text-xs font-semibold text-nowrap sm:text-sm">
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
          Your Position
        </span>
      ),
      cell: ({ row }) => {
        const pool = row.original;
        return (
          <span className="text-primary flex justify-end font-semibold">
            {pool.userPosition ? (
              `${(Number(pool.userPosition.toString()) / 100).toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}`
            ) : (
              <span className="skeleton h-4 w-16" />
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "tvl",
      header: () => (
        <span className="text-primary flex justify-end font-semibold">
          Your TVL
        </span>
      ),
      cell: ({ row }) => {
        const position = row.original;

        if (
          !position.poolInformation ||
          !tokenMap ||
          !priceMap ||
          pricesLoading
        ) {
          return (
            <span className="text-primary flex justify-end font-semibold">
              <span className="skeleton h-4 w-12" />
            </span>
          );
        }

        // Calculate user's share of the pool
        const userLPBalance = BigInt(position.userPosition || 0);
        const totalLPSupply = BigInt(position.poolInformation.totalSupply || 1);

        if (totalLPSupply === BigInt(0)) {
          return (
            <span className="text-primary flex justify-end font-semibold">
              $0.00
            </span>
          );
        }

        // Calculate user's proportional token amounts
        const reserveA = BigInt(position.poolInformation.reserveA || 0);
        const reserveB = BigInt(position.poolInformation.reserveB || 0);

        const userPositionA = (userLPBalance * reserveA) / totalLPSupply;
        const userPositionB = (userLPBalance * reserveB) / totalLPSupply;

        const individualTvl = calculateIndividualTvl({
          tokenAContract: position.poolInformation.tokenA.address,
          tokenBContract: position.poolInformation.tokenB.address,
          userPositionA,
          userPositionB,
          tokenMap,
          priceMap,
        });

        return (
          <span className="text-primary flex justify-end font-semibold">
            {individualTvl !== undefined
              ? `$${(Number(individualTvl.toString()) / 100).toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}`
              : "—"}
          </span>
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
