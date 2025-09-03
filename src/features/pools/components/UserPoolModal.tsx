"use client";

import Link from "next/link";
import { useTokensList } from "@/shared/hooks/useTokensList";
import { Modal } from "@/shared/components";
import { TokenIcon } from "@/shared/components";
import { UserPositionResponse } from "@soroswap/sdk";
import { formatUnits } from "@/shared/lib/utils";

export const UserPoolModal = ({
  isOpen,
  onClose,
  rowData,
}: {
  isOpen: boolean;
  onClose: () => void;
  rowData: UserPositionResponse;
}) => {
  const { tokenMap } = useTokensList();
  const displayTokenA = tokenMap[rowData.poolInformation.tokenA.address]?.icon;
  const displayTokenB = tokenMap[rowData.poolInformation.tokenB.address]?.icon;
  const displayTokenAName =
    tokenMap[rowData.poolInformation.tokenA.address]?.code ??
    rowData.poolInformation.tokenA.address.slice(0, 4);
  const displayTokenBName =
    tokenMap[rowData.poolInformation.tokenB.address]?.code ??
    rowData.poolInformation.tokenB.address.slice(0, 4);

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
            <span>
              {formatUnits({
                value: rowData.poolInformation.totalSupply || "0",
                decimals: 7,
              })}
            </span>
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
                value: rowData.poolInformation.reserveA || "0",
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
                value: rowData.poolInformation.reserveB || "0",
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
            <span>{rowData.userShares.toFixed(7)}%</span>
          </div>
          <div className="text-primary flex w-full items-center justify-between text-sm">
            <span>LP Balance</span>
            <span>
              {formatUnits({
                value: rowData.userPosition,
                decimals: 7,
              })}
            </span>
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
                value: rowData.tokenAAmountEquivalent || "0",
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
                value: rowData.tokenBAmountEquivalent || "0",
                decimals: 7,
              })}
            </span>
          </div>
        </div>
        <div className="flex w-full gap-1">
          <div className="flex w-full">
            <Link
              className="btn text-md border-brand bg-brand hover:bg-brand/80 relative h-14 w-full rounded-2xl p-4 text-center font-bold text-[#ededed]"
              href={`/pools/add-liquidity/${rowData.poolInformation.tokenA.address}/${rowData.poolInformation.tokenB.address}`}
            >
              Add Liquidity
            </Link>
          </div>
          <div className="flex w-full">
            <Link
              href={`/pools/remove-liquidity/${rowData.poolInformation.tokenA.address}/${rowData.poolInformation.tokenB.address}`}
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
