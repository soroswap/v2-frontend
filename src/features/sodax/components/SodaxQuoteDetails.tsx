"use client";

import { TokenIcon } from "@/shared/components";
import { cn } from "@/shared/lib/utils/cn";
import { formatUnits } from "@/shared/lib/utils/parseUnits";
import { AssetInfo } from "@soroswap/sdk";
import { ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";
import { SodaxQuoteResponse } from "@/features/sodax/types/sodax";

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
 * Quote breakdown for any SODAX-routed pair (SODA and the other registry
 * assets alike).
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
  const detailsId = useId();

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
        type="button"
        aria-expanded={isOpen}
        aria-controls={detailsId}
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
        id={detailsId}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <dl className="space-y-3 border-t border-[#23243a] p-4">
          {/* Expected Output */}
          <div className="flex items-center justify-between">
            <dt className="text-secondary text-sm">Expected output</dt>
            <dd className="flex items-center gap-1">
              <span className="text-primary text-sm">
                {formatUnits({
                  value: quote.quotedAmount,
                  decimals: buyDecimals,
                })}
              </span>
              <TokenIcon
                src={buyToken.icon}
                name={buyToken.name}
                code={buyToken.code}
                size={20}
              />
            </dd>
          </div>

          {/* Minimum received after slippage */}
          {minOutputAmount && (
            <div className="flex items-center justify-between">
              <dt className="text-secondary text-sm">Minimum received</dt>
              <dd className="flex items-center gap-1">
                <span className="text-primary text-sm">
                  {formatUnits({
                    value: minOutputAmount,
                    decimals: buyDecimals,
                  })}
                </span>
                <TokenIcon
                  src={buyToken.icon}
                  name={buyToken.name}
                  code={buyToken.code}
                  size={20}
                />
              </dd>
            </div>
          )}

          {/* Platform */}
          <div className="flex items-center justify-between">
            <dt className="text-secondary text-sm">Platform</dt>
            <dd className="text-primary text-sm">SODAX</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};
