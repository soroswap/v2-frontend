import { BridgeAmount } from "../types/bridge";

export const USDC_ASSET_CODE = "USDC";
export const USDC_ASSET_ISSUER =
  "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

// USDC Asset configuration
export const USDC_ASSET = {
  code: USDC_ASSET_CODE,
  issuer: USDC_ASSET_ISSUER,
};

export const PREDEFINED_AMOUNTS: BridgeAmount[] = [
  { label: "1 USDC", value: "1" },
  { label: "20 USDC", value: "20" },
  { label: "100 USDC", value: "100" },
  { label: "200 USDC", value: "200" },
  { label: "500 USDC", value: "500" },
  { label: "Customize", value: "custom" },
];
