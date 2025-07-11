"use client";

import { useTokensList } from "@/shared/hooks/useTokensList";
import { Modal } from "@/shared/components";
import { TokenIcon } from "@/shared/components";
import { UserPosition } from "@soroswap/sdk";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <TokenIcon
              src={tokenMap[rowData.poolInfo.tokenA]?.icon}
              alt={
                tokenMap[rowData.poolInfo.tokenA]?.code ??
                rowData.poolInfo.tokenA
              }
              className="rounded-full border border-white bg-white"
            />
            <TokenIcon
              src={tokenMap[rowData.poolInfo.tokenB]?.icon}
              alt={
                tokenMap[rowData.poolInfo.tokenB]?.code ??
                rowData.poolInfo.tokenB
              }
              className="absolute top-0 left-3 rounded-full border border-white bg-white"
            />
          </div>
          <span className="font-semibold text-white">
            {tokenMap[rowData.poolInfo.tokenA]?.code ??
              rowData.poolInfo.tokenA.slice(0, 4)}
            /
            {tokenMap[rowData.poolInfo.tokenB]?.code ??
              rowData.poolInfo.tokenB.slice(0, 4)}
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
                src={tokenMap[rowData.poolInfo.tokenA]?.icon}
                alt={
                  tokenMap[rowData.poolInfo.tokenA]?.code ??
                  rowData.poolInfo.tokenA
                }
                className="rounded-full border border-white bg-white"
              />
              {tokenMap[rowData.poolInfo.tokenA]?.code ??
                rowData.poolInfo.tokenA.slice(0, 4)}
            </div>
            <span>-</span>
          </div>
          <div className="flex w-full items-center justify-between text-sm text-white">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={tokenMap[rowData.poolInfo.tokenB]?.icon}
                alt={
                  tokenMap[rowData.poolInfo.tokenB]?.code ??
                  rowData.poolInfo.tokenB
                }
                className="rounded-full border border-white bg-white"
              />
              {tokenMap[rowData.poolInfo.tokenB]?.code ??
                rowData.poolInfo.tokenB.slice(0, 4)}
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
                src={tokenMap[rowData.poolInfo.tokenA]?.icon}
                alt={
                  tokenMap[rowData.poolInfo.tokenA]?.code ??
                  rowData.poolInfo.tokenA
                }
                className="rounded-full border border-white bg-white"
              />
              {tokenMap[rowData.poolInfo.tokenA]?.code ??
                rowData.poolInfo.tokenA.slice(0, 4)}
            </div>
            <span>-</span>
          </div>
          <div className="flex w-full items-center justify-between text-sm text-white">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={tokenMap[rowData.poolInfo.tokenB]?.icon}
                alt={
                  tokenMap[rowData.poolInfo.tokenB]?.code ??
                  rowData.poolInfo.tokenB
                }
                className="rounded-full border border-white bg-white"
              />
              {tokenMap[rowData.poolInfo.tokenB]?.code ??
                rowData.poolInfo.tokenB.slice(0, 4)}
            </div>
            <span>-</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
