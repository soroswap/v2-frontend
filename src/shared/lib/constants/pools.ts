import { SwapSettings } from "@/features/swap/types";
import { SupportedProtocols } from "@soroswap/sdk";

export const DEFAULT_POOLS_SETTINGS: SwapSettings = {
  slippageMode: "auto",
  customSlippage: "1",
  maxHops: 2, // Removed from the UI pools-settings for now.
  protocols: [
    SupportedProtocols.AQUA,
    SupportedProtocols.SOROSWAP,
    SupportedProtocols.PHOENIX,
  ],
};
