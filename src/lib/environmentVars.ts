import { WalletNetwork } from "@creit.tech/stellar-wallets-kit";
import { z } from "zod";

/**
 * This file centralizes all environment variables with strict Zod validation.
 * If any required variable is missing or invalid, the application will fail to start.
 * This prevents exposing incorrect APIs or misconfigured endpoints.
 */

const environmentSchema = z.object({
  NEXT_PUBLIC_ENV: z.enum(["production", "testnet"], {
    errorMap: () => ({
      message: 'NEXT_PUBLIC_ENV must be either "production" or "testnet"',
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
  console.error("- NEXT_PUBLIC_ENV: 'production' or 'testnet'");

  throw new Error(
    "❌ Application cannot start with invalid environment configuration",
  );
}
// All environment variables are now guaranteed to be valid
const validatedEnv = parseResult.data;

// Environment flags derived from validated env
const isDev = validatedEnv.NEXT_PUBLIC_ENV === "testnet";
const isProduction = validatedEnv.NEXT_PUBLIC_ENV === "production";

export const envVars = {
  isDev,
  isProduction,
  isTestnet: isDev,

  STELLAR: {
    WALLET_NETWORK:
      process.env.NEXT_PUBLIC_STELLAR_WALLET_NETWORK === "testnet"
        ? WalletNetwork.TESTNET
        : WalletNetwork.PUBLIC,
  },
};

export const {
  isDev: isTestnetEnv,
  isProduction: isProductionEnv,
  STELLAR,
} = envVars;
