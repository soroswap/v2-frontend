import { DEFINDEX } from "@/shared/lib/environmentVars";
import { DefindexSDK } from "@defindex/sdk";

export const defindexClient = new DefindexSDK({
  apiKey: DEFINDEX.API_KEY,
  baseUrl: DEFINDEX.BASE_URL,
});
