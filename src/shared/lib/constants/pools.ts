import { SwapSettings } from "@/features/swap/types";
import { SupportedProtocols } from "@soroswap/sdk";

/**
 * Pools only read `customSlippage` from these settings today; `protocols` is kept for the shared
 * `SwapSettings` shape and lists the AMM venues (no SDEX, no Comet, Phoenix no longer routed).
 */
export const DEFAULT_POOLS_SETTINGS: SwapSettings = {
  slippageMode: "auto",
  customSlippage: "1",
  protocols: [
    SupportedProtocols.SOROSWAP,
    SupportedProtocols.AQUA,
    SupportedProtocols.SUSHI,
  ],
};
