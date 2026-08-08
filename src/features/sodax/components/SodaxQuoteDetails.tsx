"use client";

import { TokenIcon } from "@/shared/components";
import { cn } from "@/shared/lib/utils/cn";
import { formatUnits } from "@/shared/lib/utils/parseUnits";
import { AssetInfo } from "@soroswap/sdk";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { SodaxQuoteResponse } from "../types/sodax";

interface SodaxQuoteDetailsProps {
  quote: SodaxQuoteResponse | undefined;
  /** Input amount in smallest unit of the sell token. */
  inputAmount: string | null;
  /** Minimum acceptable output in smallest unit (quote minus slippage). */
  minOutputAmount: string | null;
  sellToken: AssetInfo | null;
  buyToken: AssetInfo | null;
  className?: string;
}

/**
 * Quote breakdown for SODA pairs routed through the SODAX solver.
 * Mirrors SwapQuoteDetails' collapsed-rate / expandable-details layout.
 */
export const SodaxQuoteDetails = ({
  quote,
  inputAmount,
  minOutputAmount,
  sellToken,
  buyToken,
  className,
}: SodaxQuoteDetailsProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (!quote || !inputAmount || !sellToken || !buyToken) {
    return null;
  }

  const sellDecimals = sellToken.decimals ?? 7;
  const buyDecimals = buyToken.decimals ?? 7;

  const amountIn = Number(
    formatUnits({ value: inputAmount, decimals: sellDecimals }),
  );
  const amountOut = Number(
    formatUnits({ value: quote.quotedAmount, decimals: buyDecimals }),
  );
  const conversionRate = amountIn > 0 ? amountOut / amountIn : 0;

  return (
    <div
      className={cn(
        "bg-surface overflow-hidden rounded-2xl border border-[#23243a]",
        className,
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-brand/5 flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors"
      >
        <p className="text-secondary text-sm">
          1 {sellToken.code} = {conversionRate.toFixed(6)} {buyToken.code}
        </p>
        <div
          className={cn(
            "transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        >
          <ChevronDownIcon className="text-secondary size-4" />
        </div>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="space-y-3 border-t border-[#23243a] p-4">
          {/* Expected Output */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">Expected output</p>
            <div className="flex items-center gap-1">
              <p className="text-primary text-sm">
                {formatUnits({
                  value: quote.quotedAmount,
                  decimals: buyDecimals,
                })}
              </p>
              <TokenIcon
                src={buyToken.icon}
                name={buyToken.name}
                code={buyToken.code}
                size={20}
              />
            </div>
          </div>

          {/* Minimum received after slippage */}
          {minOutputAmount && (
            <div className="flex items-center justify-between">
              <p className="text-secondary text-sm">Minimum received</p>
              <div className="flex items-center gap-1">
                <p className="text-primary text-sm">
                  {formatUnits({
                    value: minOutputAmount,
                    decimals: buyDecimals,
                  })}
                </p>
                <TokenIcon
                  src={buyToken.icon}
                  name={buyToken.name}
                  code={buyToken.code}
                  size={20}
                />
              </div>
            </div>
          )}

          {/* Platform */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">Platform</p>
            <p className="text-primary text-sm">SODAX Solver</p>
          </div>
        </div>
      </div>
    </div>
  );
};
