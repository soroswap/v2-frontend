import { SupportedProtocols } from "@soroswap/sdk";

export interface SwapSettings {
  slippageMode: "auto" | "custom";
  customSlippage: string;
  maxHops: number;
  protocols: SupportedProtocols[];
}

// export type QuoteRequest = {
//   assetIn: string;
//   assetOut: string;
//   amount: string; // TODO: Use the correct type from Soroswap SDK and handle the bigint amount to string.
//   tradeType: TradeType;
//   protocols: SupportedProtocols[];
//   parts: number;
//   slippageTolerance: string;
//   assetList?: string[];
//   maxHops?: number;
// };

// export interface QuoteResponse {
//   code: string;
//   data: BuildSplitTradeReturn | BuildTradeReturn;
// }

// export type BuildTradeReturn =
//   | ExactInBuildTradeReturn
//   | ExactOutBuildTradeReturn;

// export type BuildSplitTradeReturn =
//   | ExactInSplitBuildTradeReturn
//   | ExactOutSplitBuildTradeReturn;

// export enum TradeType {
//   EXACT_IN = "EXACT_IN",
//   EXACT_OUT = "EXACT_OUT",
// }

// interface CommonBuildTradeReturnFields {
//   assetIn: string;
//   assetOut: string;
//   priceImpact: {
//     numerator: bigint;
//     denominator: bigint;
//   };
//   feeBps?: number;
//   feeAmount?: bigint;
//   xdr?: string;
//   from?: string;
//   to?: string;
//   referralId?: string;
// }

// interface ExactInBuildTradeReturn extends CommonBuildTradeReturnFields {
//   tradeType: TradeType.EXACT_IN;
//   trade: {
//     amountIn: bigint;
//     amountOutMin: bigint;
//     expectedAmountOut?: bigint;
//     path: string[];
//     poolHashes?: string[];
//   };
// }

// interface ExactOutBuildTradeReturn extends CommonBuildTradeReturnFields {
//   tradeType: TradeType.EXACT_OUT;
//   trade: {
//     amountOut: bigint;
//     amountInMax: bigint;
//     expectedAmountIn?: bigint;
//     path: string[];
//     poolHashes?: string[];
//   };
// }

// export interface DistributionReturn {
//   protocol_id: SupportedProtocols;
//   path: string[];
//   parts: number;
//   is_exact_in: boolean;
//   poolHashes?: string[];
// }

// interface ExactInSplitBuildTradeReturn extends CommonBuildTradeReturnFields {
//   tradeType: TradeType.EXACT_IN;
//   trade: {
//     amountIn: bigint;
//     amountOutMin: bigint;
//     expectedAmountOut?: bigint;
//     distribution: DistributionReturn[];
//   };
// }

// interface ExactOutSplitBuildTradeReturn extends CommonBuildTradeReturnFields {
//   tradeType: TradeType.EXACT_OUT;
//   trade: {
//     amountOut: bigint;
//     amountInMax: bigint;
//     expectedAmountIn?: bigint;
//     distribution: DistributionReturn[];
//   };
// }
