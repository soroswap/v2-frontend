"use client";

import { useUserContext } from "@/contexts";
import { useUserPoolPositions } from "@/features/pools/hooks/useUserPoolPositions";
import { ConnectWallet } from "@/shared/components/buttons";

export const UserLiquidity = () => {
  const { address } = useUserContext();

  const { positions: userPositions, isLoading: positionsLoading } =
    useUserPoolPositions(address);

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
            <ConnectWallet className="w-full max-w-xs" />
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
            <div className="flex flex-col gap-4 overflow-x-auto">
              {userPositions.map((pos) => (
                <div
                  key={pos.poolInfo.address}
                  className="flex min-w-[220px] flex-shrink-0 flex-col items-center gap-2 rounded-2xl border border-[#23243a] bg-[#10121A]/70 p-4"
                >
                  <p className="text-xs text-[#A0A3C4]">POSITION SIZE</p>
                  <p className="font-medium break-all text-white">
                    {pos.userPosition || "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
      </div>
    </section>
  );
};
