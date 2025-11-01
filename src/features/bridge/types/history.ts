export interface BridgeHistoryItem {
  id: string;
  paymentId: string;
  amount: string;
  destinationAddress: string;
  fromChain: "Stellar" | "Base" | "Ethereum" | "Polygon" | "Solana";
  toChain: "Stellar" | "Base" | "Ethereum" | "Polygon" | "Solana";
  completedAt: string;
  walletAddress: string;
}

export interface BridgeHistoryStorage {
  [walletAddress: string]: BridgeHistoryItem[];
}
