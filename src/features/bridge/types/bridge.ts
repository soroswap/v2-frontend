export type BridgeMode = "deposit" | "withdraw";

export interface BridgeAmount {
  label: string;
  value: string;
}

export interface BridgeSettings {
  // Future bridge-specific settings can be added here
  // e.g., destination chain, bridge provider, etc.
}

export interface TrustlineStatus {
  exists: boolean;
  balance: string;
  checking: boolean;
}

export interface AccountStatus {
  exists: boolean;
  xlmBalance: string;
  checking: boolean;
}

export interface AccountAndTrustlineData {
  accountExists: boolean;
  xlmBalance: string;
  usdcTrustlineExists: boolean;
  usdcBalance: string;
}

export interface UseUSDCTrustlineReturn {
  trustlineStatus: TrustlineStatus;
  accountStatus: AccountStatus;
  hasCheckedOnce: boolean;
  checkAccountAndTrustline: () => Promise<void>;
  createTrustline: () => Promise<void>;
  isCreating: boolean;
}
