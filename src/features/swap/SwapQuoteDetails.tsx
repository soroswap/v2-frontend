"use client";

import { cn } from "@/shared/lib/utils/cn";
import { AssetInfo } from "@soroswap/sdk";
import { formatUnits } from "@/shared/lib/utils/parseUnits";
import { useState } from "react";
import { QuoteResponse, TradeType } from "@soroswap/sdk";

interface SwapQuoteDetailsProps {
  quote: QuoteResponse | null;
  sellToken: AssetInfo | null;
  buyToken: AssetInfo | null;
  className?: string;
}

export const SwapQuoteDetails = ({
  quote,
  sellToken,
  buyToken,
  className,
}: SwapQuoteDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!quote || !sellToken || !buyToken) {
    return null;
  }

  // Calculate conversion rate
  const getConversionRate = () => {
    if (quote.tradeType === TradeType.EXACT_IN) {
      const amountIn = Number(
        formatUnits({ value: quote.amountIn.toString() }),
      );
      const expectedOut = Number(
        formatUnits({
          value: quote.amountOut?.toString() ?? "0",
        }),
      );
      return expectedOut / amountIn;
    } else {
      const amountOut = Number(
        formatUnits({ value: quote.amountOut.toString() }),
      );
      const expectedIn = Number(
        formatUnits({ value: quote.amountIn?.toString() ?? "0" }),
      );
      return amountOut / expectedIn;
    }
  };

  // Get expected output amount
  const getExpectedOutput = () => {
    if (quote.tradeType === TradeType.EXACT_IN) {
      return formatUnits({
        value: quote.amountOut?.toString() ?? "0",
      });
    } else {
      return formatUnits({ value: quote.amountOut.toString() });
    }
  };

  // Get network fee
  const getNetworkFee = () => {
    if (quote.platformFee?.feeAmount) {
      return formatUnits({ value: quote.platformFee.feeAmount.toString() });
    }
    return "0.00001"; // Default estimated network fee
  };

  const getTradingPath = () => {
    //TODO: Implement this with the routePlan object

    if ("path" in quote.rawTrade) {
      // For regular trades, we need to map contract addresses to token symbols
      // For now, we'll show a simplified path
      return `${sellToken.code} > ${buyToken.code}`;
    }
    return `${sellToken.code} > ${buyToken.code}`;
  };

  // Get platform name
  const getPlatformName = () => {
    // This would ideally come from the quote data
    // For now, return a default based on available protocols
    return "SDEX";
  };

  const conversionRate = getConversionRate();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[#23243a] bg-[#10121A]",
        className,
      )}
    >
      {/* Header - Always visible and clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#8866DD]/5"
      >
        <span className="text-sm text-[#A0A3C4]">
          1 {sellToken.code} = {conversionRate.toFixed(6)} {buyToken.code}
        </span>
        <div
          className={cn(
            "transition-transform duration-200",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-[#A0A3C4]"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Details - Smooth expansion that pushes content below */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="space-y-3 border-t border-[#23243a] p-4">
          {/* Network Fee */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A0A3C4]">Network fee</span>
            <span className="text-sm text-white">
              ~{getNetworkFee()} {sellToken.code}
            </span>
          </div>

          {/* Price Impact */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A0A3C4]">Price Impact</span>
            <span
              className={cn(
                "text-sm",
                Number(quote.priceImpactPct) > 5
                  ? "text-red-400"
                  : Number(quote.priceImpactPct) > 2
                    ? "text-yellow-400"
                    : "text-green-400",
              )}
            >
              ~{quote.priceImpactPct}%
            </span>
          </div>

          {/* Expected Output */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A0A3C4]">Expected output</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-white">
                {getExpectedOutput()} {buyToken.code}
              </span>
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#8866DD]/20">
                <span className="text-xs text-[#8866DD]">?</span>
              </div>
            </div>
          </div>

          {/* Trading Path */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A0A3C4]">Path</span>
            <span className="text-sm text-white">{getTradingPath()}</span>
          </div>

          {/* Platform */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A0A3C4]">Platform</span>
            <span className="text-sm text-white">{getPlatformName()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
