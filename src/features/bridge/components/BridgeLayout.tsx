"use client";

import { useUserContext } from "@/contexts";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { useUSDCTrustline } from "../hooks/useUSDCTrustline";
import { BridgeChainsStacked } from "./BridgeChainsStacked";
import { DepositBridge } from "./BridgeDeposit";

export const BridgeLayout = () => {
  const { address: userAddress } = useUserContext();

  const hasInitialized = useRef(false);

  const trustlineData = useUSDCTrustline(false);

  useEffect(() => {
    if (userAddress && !hasInitialized.current) {
      hasInitialized.current = true;
      trustlineData.checkAccountAndTrustline();
    } else if (!userAddress) {
      hasInitialized.current = false;
    }
  }, [userAddress, trustlineData]);
  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-primary text-xl sm:text-2xl">Bridge</p>
        <div className="flex items-center gap-4">
          <BridgeChainsStacked excludeChains={["stellar"]} />

          <div className="m-auto flex items-center justify-center">
            <ArrowRight size={20} />
          </div>

          <BridgeChainsStacked excludeChains={["base", "polygon", "solana"]} />
        </div>
      </div>

      <DepositBridge trustlineData={trustlineData} />

      {/* <BridgeToggle
        bridgeMode={bridgeMode}
        onModeChange={handleModeChange}
        disabled={isWithdrawInProgress}
      /> */}

      {/* {bridgeMode === "deposit" ? (
        <DepositBridge trustlineData={trustlineData} />
      ) : (
        <WithdrawBridge
          trustlineData={trustlineData}
          onWithdrawStateChange={handleWithdrawStateChange}
        />
      )} */}
    </div>
  );
};
