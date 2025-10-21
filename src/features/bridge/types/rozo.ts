import { ExternalPaymentOptionsString } from "@rozoai/intent-common";
import { Address } from "viem";

// Unified Intent Pay configuration for all transfer types
export interface IntentPayConfig {
  appId: string;
  toChain: number;
  toToken: Address; // USDC token address on destination chain
  toAddress?: Address; // Destination EVM address
  toStellarAddress?: string; // Destination Stellar address
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
}
