export type QuoteRequest = {
  assetIn: string;
  assetOut: string;
  amount: string;
  tradeType: TradeType;
  protocols: SupportedProtocols[];
  parts: number;
  slippageTolerance: string;
  assetList?: string[];
  maxHops?: number;
  from?: string; // If user is connected send this [ Connected Wallet ]
  to?: string; // If user is connected send this [ Connected Wallet ]
};

export type QuoteResponse = BuildSplitTradeReturn | BuildTradeReturn;

export type BuildTradeReturn =
  | ExactInBuildTradeReturn
  | ExactOutBuildTradeReturn;

export type BuildSplitTradeReturn =
  | ExactInSplitBuildTradeReturn
  | ExactOutSplitBuildTradeReturn;

export enum TradeType {
  EXACT_IN = "EXACT_IN",
  EXACT_OUT = "EXACT_OUT",
}

interface CommonBuildTradeReturnFields {
  assetIn: string;
  assetOut: string;
  priceImpact: {
    numerator: bigint;
    denominator: bigint;
  };
  feeBps?: number;
  feeAmount?: bigint;
  xdr?: string;
  from?: string;
  to?: string;
  referralId?: string;
}

interface ExactInBuildTradeReturn extends CommonBuildTradeReturnFields {
  tradeType: TradeType.EXACT_IN;
  trade: {
    amountIn: bigint;
    amountOutMin: bigint;
    expectedAmountOut?: bigint;
    path: string[];
    poolHashes?: string[];
  };
}

interface ExactOutBuildTradeReturn extends CommonBuildTradeReturnFields {
  tradeType: TradeType.EXACT_OUT;
  trade: {
    amountOut: bigint;
    amountInMax: bigint;
    expectedAmountIn?: bigint;
    path: string[];
    poolHashes?: string[];
  };
}

export enum SupportedProtocols {
  SOROSWAP = "soroswap",
  PHOENIX = "phoenix",
  AQUA = "aqua",
  COMET = "comet",
}

export interface DistributionReturn {
  protocol_id: SupportedProtocols;
  path: string[];
  parts: number;
  is_exact_in: boolean;
  poolHashes?: string[];
}

interface ExactInSplitBuildTradeReturn extends CommonBuildTradeReturnFields {
  tradeType: TradeType.EXACT_IN;
  trade: {
    amountIn: bigint;
    amountOutMin: bigint;
    expectedAmountOut?: bigint;
    distribution: DistributionReturn[];
  };
}

interface ExactOutSplitBuildTradeReturn extends CommonBuildTradeReturnFields {
  tradeType: TradeType.EXACT_OUT;
  trade: {
    amountOut: bigint;
    amountInMax: bigint;
    expectedAmountIn?: bigint;
    distribution: DistributionReturn[];
  };
}
