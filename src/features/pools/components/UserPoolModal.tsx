"use client";

import { useTokensList } from "@/shared/hooks/useTokensList";
import { Modal, TheButton } from "@/shared/components";
import { TokenIcon } from "@/shared/components";
import { UserPosition } from "@soroswap/sdk";
import Link from "next/link";

export const UserPoolModal = ({
  isOpen,
  onClose,
  rowData,
}: {
  isOpen: boolean;
  onClose: () => void;
  rowData: UserPosition;
}) => {
  const { tokenMap } = useTokensList();
  const displayTokenA = tokenMap[rowData.poolInfo.tokenA]?.icon;
  const displayTokenB = tokenMap[rowData.poolInfo.tokenB]?.icon;
  const displayTokenAName =
    tokenMap[rowData.poolInfo.tokenA]?.code ??
    rowData.poolInfo.tokenA.slice(0, 4);
  const displayTokenBName =
    tokenMap[rowData.poolInfo.tokenB]?.code ??
    rowData.poolInfo.tokenB.slice(0, 4);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <TokenIcon
              src={displayTokenA}
              alt={displayTokenAName}
              className="rounded-full border border-white bg-white"
            />
            <TokenIcon
              src={displayTokenB}
              alt={displayTokenBName}
              className="absolute top-0 left-3 rounded-full border border-white bg-white"
            />
          </div>
          <span className="font-semibold text-white">
            {displayTokenAName}/{displayTokenBName}
          </span>
        </div>

        {/* Liquidity Pool */}
        <div className="flex w-full flex-col gap-1">
          <p className="text-sm text-[#A0A3C4]">Liquidity Pool</p>
          <div className="flex w-full items-center justify-between text-sm text-white">
            <span>Total LP</span>
            <span>-</span>
          </div>
          <div className="flex w-full items-center justify-between text-sm text-white">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={displayTokenA}
                alt={displayTokenAName}
                className="rounded-full border border-white bg-white"
              />
              {displayTokenAName}
            </div>
            <span>-</span>
          </div>
          <div className="flex w-full items-center justify-between text-sm text-white">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={displayTokenB}
                alt={displayTokenBName}
                className="rounded-full border border-white bg-white"
              />
              {displayTokenBName}
            </div>
            <span>-</span>
          </div>
        </div>

        {/* Your Liquidity */}
        <div className="flex w-full flex-col gap-1">
          <p className="text-sm text-[#A0A3C4]">Your Liquidity</p>
          <div className="flex w-full items-center justify-between text-sm text-white">
            <span>Share of pool</span>
            <span>-</span>
          </div>
          <div className="flex w-full items-center justify-between text-sm text-white">
            <span>LP Balance</span>
            <span>-</span>
          </div>
          <div className="flex w-full items-center justify-between text-sm text-white">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={displayTokenA}
                alt={displayTokenAName}
                className="rounded-full border border-white bg-white"
              />
              {displayTokenAName}
            </div>
            <span>-</span>
          </div>
          <div className="flex w-full items-center justify-between text-sm text-white">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={displayTokenB}
                alt={displayTokenBName}
                className="rounded-full border border-white bg-white"
              />
              {displayTokenBName}
            </div>
            <span>-</span>
          </div>
        </div>

        <div className="flex w-full gap-1">
          <div className="flex w-full">
            <Link
              className="btn text-md relative h-14 w-full rounded-2xl border-[#8866DD] bg-[#8866DD]/10 p-4 font-bold hover:bg-[#8866DD]/80"
              href={`/pools/add-liquidity/${rowData.poolInfo.tokenA}/${rowData.poolInfo.tokenB}`}
            >
              Add Liquidity
            </Link>
          </div>
          <div className="flex w-full">
            <TheButton className="btn text-md relative h-14 w-full rounded-2xl border-[#8866DD] bg-[#8866DD]/10 p-4 font-bold hover:bg-[#8866DD]/80">
              Remove Liquidity
            </TheButton>
          </div>
        </div>
      </div>
    </Modal>
  );
};
