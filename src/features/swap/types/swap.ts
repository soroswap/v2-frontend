import { SupportedProtocols } from "@soroswap/sdk";

export interface SwapSettings {
  slippageMode: "auto" | "custom";
  customSlippage: string;
  maxHops: number;
  protocols: SupportedProtocols[];
}
