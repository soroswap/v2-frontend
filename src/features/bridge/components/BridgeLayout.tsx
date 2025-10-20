"use client";

import { useState, useRef, useEffect } from "react";
import { BridgeToggle } from "./BridgeToggle";
import { DepositBridge } from "./BridgeDeposit";
import { WithdrawBridge } from "./BridgeWithdraw";
import { useUSDCTrustline } from "../hooks/useUSDCTrustline";
import { BridgeMode } from "../types";
import { useUserContext } from "@/contexts";

export const BridgeContainer = () => {
  const [bridgeMode, setBridgeMode] = useState<BridgeMode>("deposit");
  const [isWithdrawInProgress, setIsWithdrawInProgress] = useState(false);
  const hasInitialized = useRef(false);
  const { address: userAddress } = useUserContext();

  const trustlineData = useUSDCTrustline(false);

  useEffect(() => {
    if (userAddress && !hasInitialized.current) {
      hasInitialized.current = true;
      trustlineData.checkAccountAndTrustline();
    } else if (!userAddress) {
      hasInitialized.current = false;
    }
  }, [userAddress, trustlineData]);

  const handleModeChange = (mode: BridgeMode) => {
    setBridgeMode(mode);
  };

  const handleWithdrawStateChange = (isInProgress: boolean) => {
    setIsWithdrawInProgress(isInProgress);
  };

  return (
    <div className="flex flex-col gap-6">
      <BridgeToggle
        bridgeMode={bridgeMode}
        onModeChange={handleModeChange}
        disabled={isWithdrawInProgress}
      />

      {bridgeMode === "deposit" ? (
        <DepositBridge trustlineData={trustlineData} />
      ) : (
        <WithdrawBridge
          trustlineData={trustlineData}
          onWithdrawStateChange={handleWithdrawStateChange}
        />
      )}
    </div>
  );
};
