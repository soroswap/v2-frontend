import { WalletNetwork } from "@creit.tech/stellar-wallets-kit/types";
import { SupportedNetworks } from "@soroswap/sdk";
import { z } from "zod";

/**
 * This file centralizes all environment variables with strict Zod validation.
 * Only validates client-side variables (NEXT_PUBLIC_*).
 */

const environmentSchema = z.object({
  NEXT_PUBLIC_ENV: z.enum(["mainnet", "testnet"], {
    errorMap: () => ({
      message: 'NEXT_PUBLIC_ENV must be either "mainnet" or "testnet"',
    }),
  }),
});

const parseResult = environmentSchema.safeParse({
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
});

if (!parseResult.success) {
  console.error("❌ Environment variables validation failed:");
  console.error(parseResult.error.flatten().fieldErrors);
  console.error("\n📋 Required environment variables:");
  console.error("- NEXT_PUBLIC_ENV: 'mainnet' or 'testnet'");

  throw new Error(
    "❌ Application cannot start with invalid environment configuration",
  );
}
// All environment variables are now guaranteed to be valid
const validatedEnv = parseResult.data;

// Environment flags derived from validated env
const isDev = validatedEnv.NEXT_PUBLIC_ENV === "testnet";
const isProduction = validatedEnv.NEXT_PUBLIC_ENV === "mainnet";

export const envVars = {
  isDev,
  isProduction,
  isTestnet: isDev,
  network: validatedEnv.NEXT_PUBLIC_ENV,

  STELLAR: {
    WALLET_NETWORK:
      validatedEnv.NEXT_PUBLIC_ENV === "testnet"
        ? WalletNetwork.TESTNET
        : WalletNetwork.PUBLIC,
  },

  SOROSWAP: {
    API_KEY: process.env.SOROSWAP_API_KEY || "",
    BASE_URL: process.env.SOROSWAP_API_URL || "",
    NETWORK:
      validatedEnv.NEXT_PUBLIC_ENV === "testnet"
        ? SupportedNetworks.TESTNET
        : SupportedNetworks.MAINNET,
  },

  DEFINDEX: {
    API_KEY: process.env.DEFINDEX_API_KEY || "",
    BASE_URL: process.env.DEFINDEX_API_URL || "",
    NETWORK:
      validatedEnv.NEXT_PUBLIC_ENV === "testnet"
        ? SupportedNetworks.TESTNET
        : SupportedNetworks.MAINNET,
  },
};

export const {
  isDev: isTestnetEnv,
  isProduction: isProductionEnv,
  STELLAR,
  SOROSWAP,
  DEFINDEX,
  network,
} = envVars;
