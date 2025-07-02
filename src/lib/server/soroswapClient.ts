import { SoroswapSDK } from "@soroswap/sdk";
import { SOROSWAP } from "@/lib/environmentVars";

export const soroswapClient = new SoroswapSDK({
  email: SOROSWAP.EMAIL,
  password: SOROSWAP.PASSWORD,
  defaultNetwork: SOROSWAP.NETWORK,
});
