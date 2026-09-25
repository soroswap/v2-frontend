import { SupportedProtocols } from "@soroswap/sdk";

export interface SwapSettings {
  slippageMode: "auto" | "custom";
  customSlippage: string;
  /** Venues sent as `protocols` on every quote. Route shape (hops, splits) is decided by the API. */
  protocols: SupportedProtocols[];
}
