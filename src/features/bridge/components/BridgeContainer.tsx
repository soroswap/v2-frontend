"use client";

import { useState } from "react";
import { BridgeToggle } from "./BridgeToggle";
import { DepositBridge } from "./DepositBridge";
import { WithdrawBridge } from "./WithdrawBridge";
import { useUSDCTrustline } from "../hooks/useUSDCTrustline";
import { BridgeMode } from "../types";

export const BridgeContainer = () => {
  const [bridgeMode, setBridgeMode] = useState<BridgeMode>("deposit");

  // Move the hook to this level so it persists across mode switches
  const trustlineData = useUSDCTrustline();

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
