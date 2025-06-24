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
};
