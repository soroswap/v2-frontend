import { ExternalPaymentOptionsString, FeeType } from "@rozoai/intent-common";

// Unified Intent Pay configuration for all transfer types
export interface IntentPayConfig {
  appId: string;
  toChain: number;
  toToken: string; // USDC token address on destination chain
  toAddress?: string; // Destination EVM address
  toUnits: string; // Amount in USDC units
  intent?: string; // e.g., "Transfer USDC"
  preferredChains?: number[]; // Preferred source chains
  externalId?: string; // Correlation ID
  memo?: {
    type: "text" | "id" | "hash";
    value: string;
  }; // Optional memo for Stellar transfers
  metadata?: object;
  paymentOptions?: ExternalPaymentOptionsString[];
  feeType?: FeeType;
}
