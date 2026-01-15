// Stargate Campaign Constants

/**
 * USDC Vault address for Soroswap Earn
 * Used for both mainnet and testnet
 */
export const CAMPAIGN_USDC_VAULT =
  "CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK";

/**
 * Campaign step definitions for the guided flow
 */
export const CAMPAIGN_STEPS = {
  CONNECT_STELLAR: 1,
  BRIDGE_TO_STELLAR: 2,
  DEPOSIT_TO_VAULT: 3,
  EARNING: 4,
} as const;

export type CampaignStepKey = keyof typeof CAMPAIGN_STEPS;
export type CampaignStepValue = (typeof CAMPAIGN_STEPS)[CampaignStepKey];

/**
 * Step labels for the stepper UI
 */
export const CAMPAIGN_STEP_LABELS: Record<CampaignStepValue, string> = {
  [CAMPAIGN_STEPS.CONNECT_STELLAR]: "Connect Stellar Wallet",
  [CAMPAIGN_STEPS.BRIDGE_TO_STELLAR]: "Bridge USDC to Stellar",
  [CAMPAIGN_STEPS.DEPOSIT_TO_VAULT]: "Deposit to Soroswap Earn",
  [CAMPAIGN_STEPS.EARNING]: "Earning Yield!",
};

/**
 * USDC token address on Base network
 */
export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

/**
 * Base chain ID
 */
export const BASE_CHAIN_ID = 8453;
