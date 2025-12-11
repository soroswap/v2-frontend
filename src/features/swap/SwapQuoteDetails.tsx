"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils/cn";
import { AssetInfo } from "@soroswap/sdk";
import { formatUnits } from "@/shared/lib/utils/parseUnits";
import { QuoteResponse, TradeType } from "@soroswap/sdk";
import { ChevronDownIcon } from "lucide-react";
import { TokenIcon } from "@/shared/components";
import { useAllTokensList } from "@/shared/hooks/useAllTokensList";

interface SwapQuoteDetailsProps {
  quote: QuoteResponse | undefined;
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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { tokenMapAllTokens } = useAllTokensList();

  if (!quote || !sellToken || !buyToken || !quote.amountIn) {
    return null;
  }

  // Calculate conversion rate
  const getConversionRate = (): number => {
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
        value: quote.amountOut?.toString(),
      });
    } else {
      return formatUnits({ value: quote.amountIn.toString() });
    }
  };

  // Get network fee
  // const getNetworkFee = () => {
  //   if (quote.platformFee?.feeAmount) {
  //     return formatUnits({
  //       value: quote.platformFee.feeAmount.toString(),
  //     });
  //   }

  //   return "0.00001";
  // };

  const getTradingPath = (): string => {
    if (!quote.routePlan || quote.routePlan.length === 0) return "";

    const formatPathToken = (item: string) => {
      // Try contract lookup first
      if (tokenMapAllTokens[item]?.code) return tokenMapAllTokens[item].code;
      // If string contains a separator, prefer the left part (could be contract or CODE)
      if (item.includes(":")) {
        const left = item.split(":")[0];
        return tokenMapAllTokens[left]?.code || left;
      }
      // Fallback to shortened identifier
      return `${item.slice(0, 4)}`;
    };

    const formatProtocolName = (protocol: string): string => {
      if (protocol === "sdex") return "SDEX";
      return protocol.charAt(0).toUpperCase() + protocol.slice(1).toLowerCase();
    };

    const formatPercent = (percent: string): string => {
      const num = Number(percent);
      if (!Number.isFinite(num)) return "";
      // Convert to percentage if it's a decimal (0.33 -> 33%)
      const pct = num <= 1 ? Math.round(num * 100) : Math.round(num);
      return ` (${pct}%)`;
    };

    const routeStrings = quote.routePlan.map((route) => {
      const protocol = formatProtocolName(route.swapInfo.protocol);
      const path = route.swapInfo.path.map(formatPathToken).join(" > ");
      const percentage = formatPercent(route.percent);
      return `${protocol}: ${path}${percentage}`;
    });

    return routeStrings.join("\n");
  };

  // Get platform name
  const getPlatformName = () => {
    return (
      <div>
        {quote.routePlan.map((route) => (
          <p key={route.swapInfo.protocol}>
            {route.swapInfo.protocol.toUpperCase()}
          </p>
        ))}
      </div>
    );
  };

  const conversionRate = getConversionRate();

  return (
    <div
      className={cn(
        "bg-surface overflow-hidden rounded-2xl border border-[#23243a]",
        className,
      )}
    >
      {/* Header - Always visible and clickable */}
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

      {/* Details - Smooth expansion that pushes content below */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="space-y-3 border-t border-[#23243a] p-4">
          {/* Network Fee */}
          {/* <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">Network fee</p>
            <p className="text-primary text-sm">
              ~{getNetworkFee()} {sellToken.code}
            </p>
          </div> */}

          {/* Price Impact */}
          {/* //TODO: Check the right color >5 or <2 ? */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">Price Impact</p>
            <p
              className={cn(
                "bg-surface-alt rounded-full px-2 py-1 text-sm",
                Number(quote.priceImpactPct) > 5
                  ? "text-red-400"
                  : Number(quote.priceImpactPct) > 2
                    ? "text-yellow-400"
                    : "text-green-400",
              )}
            >
              ~{quote.priceImpactPct}%
            </p>
          </div>

          {/* Expected Output */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">
              Expected {`${quote.tradeType === TradeType.EXACT_IN ? 'output' : 'input'}`}
            </p>
            <div className="flex items-center gap-1">
              <p className="text-primary text-sm">{getExpectedOutput()}</p>
              {buyToken.contract && (quote.tradeType === TradeType.EXACT_IN) ? (
                <TokenIcon
                  src={tokenMapAllTokens[buyToken.contract]?.icon}
                  name={tokenMapAllTokens[buyToken.contract]?.name}
                  code={tokenMapAllTokens[buyToken.contract]?.code}
                  size={20}
                />
              ) : (
                sellToken.contract && (
                  <TokenIcon
                    src={tokenMapAllTokens[sellToken.contract]?.icon}
                    name={tokenMapAllTokens[sellToken.contract]?.name}
                    code={tokenMapAllTokens[sellToken.contract]?.code}
                    size={20}
                  />
                )
              )}
            </div>
          </div>

          {/* Trading Path */}
          <div className="flex items-start justify-between">
            <p className="text-secondary text-sm">Path</p>
            <div className="text-primary text-right text-sm">
              {getTradingPath()
                .split("\n")
                .map((route, index) => (
                  <p key={index} className="whitespace-nowrap">
                    {route}
                  </p>
                ))}
            </div>
          </div>

          {/* Platform */}
          <div className="flex items-center justify-between">
            <p className="text-secondary text-sm">Platform</p>
            <div className="text-primary text-sm">{getPlatformName()}</div>
            {/* <p className="text-primary text-sm">{getPlatformName()}</p> */}
          </div>
        </div>
      </div>
    </div>
  );
};
