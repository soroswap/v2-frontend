"use client";

import Link from "next/link";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { Modal } from "@/shared/components";
import { TokenIcon } from "@/shared/components";
import { UserPosition } from "@soroswap/sdk";
import { formatUnits } from "@/shared/lib/utils";

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
          <span className="text-primary font-semibold">
            {displayTokenAName}/{displayTokenBName}
          </span>
        </div>
        {/* Liquidity Pool */}
        <div className="flex w-full flex-col gap-1">
          <p className="text-secondary text-sm">Liquidity Pool</p>
          <div className="text-primary flex w-full items-center justify-between text-sm">
            <span>Total LP</span>
            {/* <span>{rowData.poolInfo.totalSupply || "0"}</span> */}
            <span>0</span>
          </div>
          <div className="text-primary flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={displayTokenA}
                alt={displayTokenAName}
                className="rounded-full border border-white bg-white"
              />
              {displayTokenAName}
            </div>
            <span>
              {formatUnits({
                value: rowData.poolInfo.reserveA || "0",
                decimals: 7,
              })}
            </span>
          </div>
          <div className="text-primary flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={displayTokenB}
                alt={displayTokenBName}
                className="rounded-full border border-white bg-white"
              />
              {displayTokenBName}
            </div>
            <span>
              {formatUnits({
                value: rowData.poolInfo.reserveB || "0",
                decimals: 7,
              })}
            </span>
          </div>
        </div>
        {/* Your Liquidity */}
        <div className="flex w-full flex-col gap-1">
          <p className="text-secondary text-sm">Your Liquidity</p>
          <div className="text-primary flex w-full items-center justify-between text-sm">
            <span>Share of pool</span>
            <span>{rowData.poolInfo.reserveLp || "0"}</span>
          </div>
          <div className="text-primary flex w-full items-center justify-between text-sm">
            <span>LP Balance</span>
            <span>{rowData.userPosition}</span>
          </div>
          <div className="text-primary flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={displayTokenA}
                alt={displayTokenAName}
                className="rounded-full border border-white bg-white"
              />
              {displayTokenAName}
            </div>
            {/* <span>
              {formatUnits({
                value: rowData.amountA || "0",
                decimals: 7,
              })}
            </span> */}
            <span>0</span>
          </div>
          <div className="text-primary flex w-full items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TokenIcon
                src={displayTokenB}
                alt={displayTokenBName}
                className="rounded-full border border-white bg-white"
              />
              {displayTokenBName}
            </div>
            {/* <span>
              {formatUnits({
                value: rowData.amountB || "0",
                decimals: 7,
              })}
            </span> */}
            <span>0</span>
          </div>
        </div>
        <div className="flex w-full gap-1">
          <div className="flex w-full">
            <Link
              className="btn text-md border-brand bg-brand hover:bg-brand/80 relative h-14 w-full rounded-2xl p-4 text-center font-bold text-[#ededed]"
              href={`/pools/add-liquidity/${rowData.poolInfo.tokenA}/${rowData.poolInfo.tokenB}`}
            >
              Add Liquidity
            </Link>
          </div>
          <div className="flex w-full">
            <Link
              href={`/pools/remove-liquidity/${rowData.poolInfo.tokenA}/${rowData.poolInfo.tokenB}`}
              className="btn text-md border-brand bg-brand/10 hover:bg-brand/80 text-primary relative h-14 w-full rounded-2xl p-4 text-center font-bold"
            >
              Remove Liquidity
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};
