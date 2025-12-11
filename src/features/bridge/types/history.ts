export type BridgeHistoryChain =
  | "Stellar"
  | "Base"
  | "Ethereum"
  | "Polygon"
  | "Solana";

export interface BridgeHistoryItem {
  id: string;
  paymentId: string;
  amount: string;
  destinationAddress: string;
  fromChain: BridgeHistoryChain;
  toChain: BridgeHistoryChain;
  completedAt: string;
  walletAddress: string;
  type: "deposit" | "withdraw";
}

export interface BridgeHistoryStorage {
  [walletAddress: string]: BridgeHistoryItem[];
}
