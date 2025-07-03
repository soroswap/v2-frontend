import { SwapSettings } from "@/components/shared/types";
import { SupportedProtocols } from "@soroswap/sdk";

export const DEFAULT_SWAP_SETTINGS: SwapSettings = {
  slippageMode: "auto",
  customSlippage: "1",
  maxHops: 2, // Removed from the UI swap-settings for now.
  protocols: [
    SupportedProtocols.AQUA,
    SupportedProtocols.SOROSWAP,
    SupportedProtocols.PHOENIX,
  ],
};
