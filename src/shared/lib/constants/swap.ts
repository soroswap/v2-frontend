import { SwapSettings } from "@/features/swap/types";
import { SupportedProtocols } from "@soroswap/sdk";

/**
 * Venues the swap UI lets the user toggle, in the order the settings modal renders them.
 * Mirrors what the API routes through on mainnet (`GET /protocols`: soroswap, aqua, sushi,
 * comet, sdex) minus Comet, which is not offered in the UI. Phoenix is no longer routed by
 * the API, so it is left out even though the SDK enum still carries it.
 */
export const SWAP_PROTOCOLS = [
  SupportedProtocols.SOROSWAP,
  SupportedProtocols.AQUA,
  SupportedProtocols.SUSHI,
  SupportedProtocols.SDEX,
] as const satisfies readonly SupportedProtocols[];

export type SwapProtocol = (typeof SWAP_PROTOCOLS)[number];

export const DEFAULT_SWAP_SETTINGS: SwapSettings = {
  slippageMode: "auto",
  customSlippage: "1", // TODO: 1 ???? should be 50 ofr 0.5% or 100 for 1%
  protocols: [...SWAP_PROTOCOLS],
};
