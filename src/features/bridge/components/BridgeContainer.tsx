"use client";

import { useState, useRef, useEffect } from "react";
import { BridgeToggle } from "./BridgeToggle";
import { DepositBridge } from "./DepositBridge";
import { WithdrawBridge } from "./WithdrawBridge";
import { useUSDCTrustline } from "../hooks/useUSDCTrustline";
import { BridgeMode } from "../types";
import { useUserContext } from "@/contexts";

export const BridgeContainer = () => {
  const [bridgeMode, setBridgeMode] = useState<BridgeMode>("deposit");
  const hasInitialized = useRef(false);
  const { address: userAddress } = useUserContext();

  // Move the hook to this level so it persists across mode switches
  // Disable auto-checking to prevent checks on mode switches
  const trustlineData = useUSDCTrustline(false);

  // Manually trigger initial check when wallet connects (only once)
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

  return (
    <div className="flex flex-col gap-6">
      <BridgeToggle bridgeMode={bridgeMode} onModeChange={handleModeChange} />

      {bridgeMode === "deposit" ? (
        <DepositBridge trustlineData={trustlineData} />
      ) : (
        <WithdrawBridge trustlineData={trustlineData} />
      )}
    </div>
  );
};
