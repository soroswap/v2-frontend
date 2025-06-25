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
