import { Horizon } from "@stellar/stellar-sdk";
import { USDC_ASSET } from "../constants/bridge";
import { AccountAndTrustlineData } from "../types/bridge";

/**
 * Combined utility function to check account status, XLM balance, and USDC trustline in one request
 */
export async function fetchAccountAndTrustlineData(
  address: string,
): Promise<AccountAndTrustlineData> {
  const server = new Horizon.Server("https://horizon.stellar.org");

  try {
    const accountData = await server.accounts().accountId(address).call();

    // Find XLM balance (native asset)
    const xlmBalance = accountData.balances.find(
      (balance) => balance.asset_type === "native",
    );

    // Look for USDC trustline in account balances
    const usdcBalance = accountData.balances.find(
      (balance) =>
        balance.asset_type !== "native" &&
        "asset_code" in balance &&
        "asset_issuer" in balance &&
        balance.asset_code === USDC_ASSET.code &&
        balance.asset_issuer === USDC_ASSET.issuer,
    );

    return {
      accountExists: true,
      xlmBalance: xlmBalance?.balance || "0",
      usdcTrustlineExists: !!usdcBalance,
      usdcBalance: usdcBalance?.balance || "0",
    };
  } catch (error) {
    // If account doesn't exist, Horizon returns 404
    if (error instanceof Error && error.message.includes("404")) {
      return {
        accountExists: false,
        xlmBalance: "0",
        usdcTrustlineExists: false,
        usdcBalance: "0",
      };
    }
    console.error("Error checking account and trustline:", error);
    throw new Error("Failed to check account and trustline");
  }
}
