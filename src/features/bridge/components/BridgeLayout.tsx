"use client";

import { useUserContext } from "@/contexts";
import { RotateArrowButton } from "@/shared/components";
import { cn } from "@/shared/lib/utils";
import { useRozoConnectStellar } from "@rozoai/intent-pay";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUSDCTrustline } from "../hooks/useUSDCTrustline";
import { BridgeChainsStacked, ChainType } from "./BridgeChainsStacked";
import { BridgeHistory } from "./BridgeHistory";
import { BridgePanel } from "./BridgePanel";
import { Stellar } from "./icons/chains";

export const BridgeLayout = () => {
  const { address: userAddress, selectedWallet } = useUserContext();
  const { setConnector, disconnect, setPublicKey } = useRozoConnectStellar();

  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

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
    if (userAddress && selectedWallet) {
      setPublicKey(userAddress);
      setConnector(selectedWallet);
    } else {
      disconnect();
    }
  }, [userAddress, selectedWallet]);

  const onSwitchTokens = useCallback(() => {
    setIsTransitioning(true);
    setIsTokenSwitched((prev: boolean) => !prev);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  }, []);

  const excludeChains: ChainType[] = isTokenSwitched
    ? ["polygon", "solana", "stellar"]
    : ["stellar"];

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-primary text-xl sm:text-2xl">Bridge</p>
        <div className="relative flex items-center justify-between gap-4">
          <BridgeChainsStacked
            excludeChains={excludeChains}
            size={40}
            isTransitioning={isTransitioning}
          />

          <RotateArrowButton
            onClick={onSwitchTokens}
            className={cn(
              "relative inset-0 translate-x-0 transition-transform duration-300",
              isTokenSwitched ? "rotate-90" : "-rotate-90",
            )}
          />

          <Stellar width={40} height={40} className="rounded-full" />
        </div>
      </div>

      <BridgePanel
        trustlineData={trustlineData}
        isTokenSwitched={isTokenSwitched}
      />

      {userAddress && trustlineData.trustlineStatus.exists && (
        <div className="mt-8">
          <BridgeHistory walletAddress={userAddress} />
        </div>
      )}
    </div>
  );
};
