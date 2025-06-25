export type SwapRouteSplitRequest = {
  assetIn: string;
  assetOut: string;
  amount: string;
  tradeType: "EXACT_IN" | "EXACT_OUT";
  protocols: string[];
  parts: number;
  slippageTolerance: string;
  assetList?: string[];
  maxHops?: number;
  from?: string; // If user is connected send this [ Connected Wallet ]
  to?: string; // If user is connected send this [ Connected Wallet ]
};

export interface SwapResponse {
  assetIn: string;
  assetOut: string;
  priceImpact: {
    numerator: string;
    denominator: string;
  };
  trade: {
    amountInMax: string;
    amountOut: string;
    distribution: {
      protocol_id: string;
      path: string[];
      parts: number;
      is_exact_in: boolean;
    }[];
    expectedAmountIn: string;
  };
  tradeType: "EXACT_IN" | "EXACT_OUT";
}
