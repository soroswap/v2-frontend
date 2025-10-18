import { BridgeAmount } from "../types/bridge";

// USDC Asset configuration
export const USDC_ASSET_MAINNET = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};

export const USDC_ASSET_TESTNET = {
  code: "USDC",
  issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

// Base Bridge Configuration
export const BASE_CONFIG = {
  chainId: "8453",
  tokenSymbol: "USDC",
  tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

export const PREDEFINED_AMOUNTS: BridgeAmount[] = [
  { label: "1 USDC", value: "1" },
  { label: "20 USDC", value: "20" },
  { label: "100 USDC", value: "100" },
  { label: "200 USDC", value: "200" },
  { label: "500 USDC", value: "500" },
  { label: "Customize", value: "custom" },
];
