"use client";

import { useUserContext } from "@/contexts";
import { RotateArrowButton } from "@/shared/components";
import { cn } from "@/shared/lib/utils";
import { useRozoConnectStellar } from "@rozoai/intent-pay";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUSDCTrustline } from "../hooks/useUSDCTrustline";
import { BridgePanel } from "./BridgePanel";
import { Base, Stellar } from "./icons/chains";

export const BridgeLayout = () => {
  const { address: userAddress, selectedWallet } = useUserContext();
  const { setConnector, disconnect } = useRozoConnectStellar();

  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);

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

  useEffect(() => {
    if (selectedWallet) {
      setConnector(selectedWallet);
    } else {
      disconnect();
    }
  }, [selectedWallet, setConnector]);

  const onSwitchTokens = useCallback(() => {
    setIsTokenSwitched((prev: boolean) => !prev);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-primary text-xl sm:text-2xl">Bridge</p>
        <div className="relative flex items-center justify-between gap-4">
          <Base width={40} height={40} />

          <RotateArrowButton
            onClick={onSwitchTokens}
            className={cn(
              "relative inset-0 translate-x-0 transition-transform duration-300",
              isTokenSwitched ? "rotate-90" : "-rotate-90",
            )}
            disabled={!userAddress}
          />

          <Stellar width={40} height={40} className="rounded-full" />
        </div>
      </div>

      <BridgePanel
        trustlineData={trustlineData}
        isTokenSwitched={isTokenSwitched}
      />
    </div>
  );
};
