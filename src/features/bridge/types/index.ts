export type BridgeMode = "deposit" | "withdraw";

export interface BridgeAmount {
  label: string;
  value: string;
}

export interface BridgeSettings {
  // Future bridge-specific settings can be added here
  // e.g., destination chain, bridge provider, etc.
}
