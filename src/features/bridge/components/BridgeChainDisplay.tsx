"use client";

import { TokenIcon } from "@/shared/components";
import { cn } from "@/shared/lib/utils/cn";
import {
  base,
  bsc,
  ethereum,
  polygon,
  rozoSolana,
  rozoStellar,
  TokenLogo,
} from "@rozoai/intent-common";
import { IndependentField } from "../hooks/useBridgeController";
import BridgeChainStacked from "./BridgeChainStacked";

interface BridgeChainDisplayProps {
  isTokenSwitched: boolean;
  independentField: IndependentField;
  className?: string;
}

export const BridgeChainDisplay = ({
  isTokenSwitched,
  independentField,
  className,
}: BridgeChainDisplayProps) => {
  const isFrom = independentField === "from";

  // Determine which chains to show based on position and switch state
  const getExcludeChains = () => {
    if (!isTokenSwitched) {
      // From: Base/Solana/Polygon, To: Stellar
      return isFrom
        ? [rozoStellar.chainId]
        : [
            base.chainId,
            rozoSolana.chainId,
            ethereum.chainId,
            bsc.chainId,
            polygon.chainId,
          ];
    } else {
      // From: Stellar, To: Base (ONLY)
      return isFrom
        ? [
            base.chainId,
            rozoSolana.chainId,
            ethereum.chainId,
            bsc.chainId,
            polygon.chainId,
          ]
        : [
            rozoStellar.chainId,
            rozoSolana.chainId,
            ethereum.chainId,
            bsc.chainId,
            polygon.chainId,
          ];
    }
  };

  const getTokenSymbol = () => {
    return !isTokenSwitched && isFrom ? "USDC/USDT" : "USDC";
  };

  return (
    <div
      className={cn(
        "border-surface-alt bg-surface-alt text-primary flex h-[33.5px] min-w-fit cursor-default items-center gap-2 rounded-full border px-1.5 py-1.5 text-xs font-bold whitespace-nowrap sm:h-[43.5px] sm:text-sm",
        className,
      )}
    >
      <TokenIcon
        src={TokenLogo.USDC}
        alt="USDC"
        name="USDC"
        code="USDC"
        className="z-10 size-5 bg-transparent sm:size-6"
      />
      {!isTokenSwitched && isFrom && (
        <TokenIcon
          src={TokenLogo.USDT}
          alt="USDT"
          name="USDT"
          code="USDT"
          className="-ml-4 size-5 bg-transparent sm:size-6"
        />
      )}
      <p className="text-primary text-xs font-bold sm:text-sm">
        {getTokenSymbol()}
      </p>
      <span className="text-secondary text-xs">on</span>
      <BridgeChainStacked excludeChains={getExcludeChains()} />
    </div>
  );
};
