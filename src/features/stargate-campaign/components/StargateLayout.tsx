"use client";

import { useStargateCampaign } from "../hooks";
import { TotalBalanceCard } from "./TotalBalanceCard";
import { WalletsPanel } from "./WalletsPanel";
import { StargateBridge } from "./StargateBridge";
import { StargateEarn } from "./StargateEarn";
import { StargateStepper } from "./StargateStepper";

export function StargateLayout() {
  const {
    campaignState,
    stellarUSDCBalance,
    stellarXLMBalance,
    vaultHoldings,
    vaultAPY,
    vaultTVL,
    vaultName,
    isLoading,
    revalidateVaultBalance,
    trustlineData,
  } = useStargateCampaign();

  // Debug: log campaign state
  console.log("[StargateLayout] Campaign State:", {
    showStepper: campaignState.showStepper,
    currentStep: campaignState.currentStep,
    stellarConnected: campaignState.stellarConnected,
    hasUSDCOnStellar: campaignState.hasUSDCOnStellar,
    hasVaultPosition: campaignState.hasVaultPosition,
    stellarUSDCBalance,
    vaultHoldings,
  });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">

      {/* Stepper - conditionally shown, or spacer when hidden */}
      {campaignState.showStepper ? (
        <StargateStepper
          className="mt-18"
          currentStep={campaignState.currentStep}
          visible={true}
        />
      ) : (
        <div className="h-12" />
      )}

      {/* Total Balance Card */}
      <TotalBalanceCard
        vaultHoldings={vaultHoldings}
        vaultAPY={vaultAPY}
        isLoading={isLoading.vaultBalance || isLoading.vaultInfo}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Wallets Panel (4 cols) */}
        <div className="lg:col-span-4">
          <WalletsPanel
            stellarUSDCBalance={stellarUSDCBalance}
            stellarXLMBalance={stellarXLMBalance}
            isLoading={isLoading.trustline}
          />
        </div>

        {/* Right Column - Bridge + Earn (8 cols) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-8">
          {/* Bridge Card */}
          <StargateBridge
            isEnabled={campaignState.bridgeEnabled}
            onBridgeCompleted={() => {
              trustlineData.refreshBalance();
              revalidateVaultBalance();
            }}
          />

          {/* Earn Card */}
          <StargateEarn
            isEnabled={campaignState.earnEnabled}
            vaultHoldings={vaultHoldings}
            vaultAPY={vaultAPY}
            vaultTVL={vaultTVL}
            vaultName={vaultName}
            stellarUSDCBalance={stellarUSDCBalance}
            isLoading={isLoading.vaultBalance || isLoading.vaultInfo}
            onSuccess={revalidateVaultBalance}
          />
        </div>
      </div>
    </div>
  );
}
