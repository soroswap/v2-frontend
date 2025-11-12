import { WalletNetwork } from "@creit.tech/stellar-wallets-kit/types";
import { Networks } from "@stellar/stellar-sdk";
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
    RPC_URL:
      validatedEnv.NEXT_PUBLIC_ENV === "testnet"
        ? "https://soroban-testnet.stellar.org"
        : "https://soroban.stellar.org",
    HORIZON_URL:
      validatedEnv.NEXT_PUBLIC_ENV === "testnet"
        ? "https://horizon-testnet.stellar.org"
        : "https://horizon.stellar.org",
    NETWORK_PASSPHRASE:
      validatedEnv.NEXT_PUBLIC_ENV === "testnet"
        ? "Test SDF Network ; September 2015"
        : "Public Global Stellar Network ; September 2015",
    ROUTER_ADDRESS:
      validatedEnv.NEXT_PUBLIC_ENV === "testnet"
        ? "CA4YSDKNIGIV77W6XDUUWFDTPCVUJ5IPZQJDQCPD65DBVG3R3XTOCFZA"
        : "CBZV3HBP672BV7FF3ZILVT4CNPW3N5V2WTJ2LAGOAYW5R7L2D5SLUDFZ",
    NETWORK:
      validatedEnv.NEXT_PUBLIC_ENV === "testnet"
        ? Networks.TESTNET
        : Networks.PUBLIC,
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
