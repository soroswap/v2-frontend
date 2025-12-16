"use client";

import { useUserContext } from "@/contexts";
import { useUSDCTrustline } from "@/features/bridge/hooks/useUSDCTrustline";
import { useVaultBalance } from "@/features/earn/hooks/useVaultBalance";
import { useVaultInfo } from "@/features/earn/hooks/useVaultInfo";
import { useMemo } from "react";
import {
  CAMPAIGN_STEPS,
  CAMPAIGN_USDC_VAULT,
  type CampaignStepValue,
} from "../constants";

export interface CampaignState {
  /** Current step in the campaign flow (1-5) */
  currentStep: CampaignStepValue;
  /** Whether Stellar wallet is connected */
  stellarConnected: boolean;
  /** Whether user has USDC balance on Stellar */
  hasUSDCOnStellar: boolean;
  /** Whether user has holdings in the vault */
  hasVaultPosition: boolean;
  /** Whether the stepper should be visible */
  showStepper: boolean;
  /** Whether the Bridge card is enabled */
  bridgeEnabled: boolean;
  /** Whether the Earn card is enabled */
  earnEnabled: boolean;
}

export interface UseStargateCampaignReturn {
  /** Campaign state for UI logic */
  campaignState: CampaignState;
  /** Stellar wallet address */
  stellarAddress: string | null;
  /** USDC balance on Stellar (formatted decimal string from Horizon API, e.g., "1.9800000") */
  stellarUSDCBalance: string;
  /** XLM balance on Stellar (formatted decimal string from Horizon API) */
  stellarXLMBalance: string;
  /** User's balance in the vault (underlying asset) */
  vaultHoldings: string;
  /** Vault APY percentage */
  vaultAPY: number;
  /** Vault total managed funds */
  vaultTVL: string;
  /** Vault name */
  vaultName: string;
  /** Vault symbol */
  vaultSymbol: string;
  /** Loading states */
  isLoading: {
    trustline: boolean;
    vaultInfo: boolean;
    vaultBalance: boolean;
  };
  /** Error states */
  isError: {
    vaultInfo: boolean;
    vaultBalance: boolean;
  };
  /** Trustline data for bridge component */
  trustlineData: ReturnType<typeof useUSDCTrustline>;
  /** Function to refresh vault balance */
  revalidateVaultBalance: () => void;
}

/**
 * Main coordinator hook for the Stargate Campaign page.
 * Combines wallet state, vault info, and campaign progress tracking.
 */
export function useStargateCampaign(): UseStargateCampaignReturn {
  const { address: stellarAddress } = useUserContext();

  // Trustline data includes USDC balance on Stellar
  const trustlineData = useUSDCTrustline(true);

  // Vault information (APY, TVL, etc.)
  const {
    vaultInfo,
    isLoading: isVaultInfoLoading,
    isError: isVaultInfoError,
  } = useVaultInfo({ vaultId: CAMPAIGN_USDC_VAULT });

  // User's vault balance
  const {
    vaultBalance,
    isLoading: isVaultBalanceLoading,
    isError: isVaultBalanceError,
    revalidate: revalidateVaultBalance,
  } = useVaultBalance({
    vaultId: CAMPAIGN_USDC_VAULT,
    userAddress: stellarAddress,
  });

  // Derived values
  const stellarUSDCBalance = trustlineData.trustlineStatus.balance || "0";
  const stellarXLMBalance = trustlineData.accountStatus.xlmBalance || "0";
  const hasUSDCOnStellar = parseFloat(stellarUSDCBalance) > 0;

  const vaultHoldings = useMemo(() => {
    if (!vaultBalance?.underlyingBalance?.[0]) return "0";
    // underlyingBalance is a bigint, convert to string
    return vaultBalance.underlyingBalance[0].toString();
  }, [vaultBalance]);

  const hasVaultPosition = parseFloat(vaultHoldings) > 0;

  // Calculate campaign state
  const campaignState = useMemo((): CampaignState => {
    const stellarConnected = Boolean(stellarAddress);

    // Determine current step
    let currentStep: CampaignStepValue;
    if (!stellarConnected) {
      currentStep = CAMPAIGN_STEPS.CONNECT_STELLAR;
    } else if (!hasUSDCOnStellar && !hasVaultPosition) {
      currentStep = CAMPAIGN_STEPS.BRIDGE_TO_STELLAR;
    } else if (!hasVaultPosition && hasUSDCOnStellar) {
      currentStep = CAMPAIGN_STEPS.DEPOSIT_TO_VAULT;
    } else {
      currentStep = CAMPAIGN_STEPS.EARNING;
    }

    // Determine component enabled states based on requirements:
    // - Sin Stellar wallet: Bridge y Earn bloqueados
    // - Con Stellar, sin USDC Stellar, sin vault balance: Solo Earn bloqueado
    // - Cualquier otro caso: Todo desbloqueado
    const bridgeEnabled = stellarConnected;
    const earnEnabled = stellarConnected && (hasUSDCOnStellar || hasVaultPosition);

    // Stepper visible when user needs guidance
    // Hidden when they have USDC on Stellar OR have vault position
    const showStepper = !stellarConnected || (!hasUSDCOnStellar && !hasVaultPosition);

    return {
      currentStep,
      stellarConnected,
      hasUSDCOnStellar,
      hasVaultPosition,
      showStepper,
      bridgeEnabled,
      earnEnabled,
    };
  }, [stellarAddress, hasUSDCOnStellar, hasVaultPosition]);

  // Extract vault info values
  const vaultAPY = vaultInfo?.apy ?? 0;
  const vaultTVL = vaultInfo?.totalManagedFunds?.[0]?.total_amount ?? "0";
  const vaultName = vaultInfo?.name ?? "Soroswap Earn BLEND USDC";
  const vaultSymbol = vaultInfo?.symbol ?? "dfUSDC";

  return {
    campaignState,
    stellarAddress,
    stellarUSDCBalance,
    stellarXLMBalance,
    vaultHoldings,
    vaultAPY,
    vaultTVL,
    vaultName,
    vaultSymbol,
    isLoading: {
      trustline:
        trustlineData.trustlineStatus.checking ||
        trustlineData.accountStatus.checking,
      vaultInfo: isVaultInfoLoading,
      vaultBalance: isVaultBalanceLoading,
    },
    isError: {
      vaultInfo: isVaultInfoError,
      vaultBalance: isVaultBalanceError,
    },
    trustlineData,
    revalidateVaultBalance,
  };
}
