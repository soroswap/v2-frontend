import { SoroswapSDK } from "@soroswap/sdk";
import { SOROSWAP } from "@/shared/lib/environmentVars";

export const soroswapClient = new SoroswapSDK({
  apiKey: SOROSWAP.API_KEY,
  baseUrl: SOROSWAP.BASE_URL,
  defaultNetwork: SOROSWAP.NETWORK,
});
