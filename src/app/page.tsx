"use client";

import { cn } from "@/lib/utils/cn";
import { useState, useEffect } from "react";
import ConnectWallet from "@/components/Buttons/ConnectWallet";
import SwapPanel from "@/components/SwapPanel";
import { RotateArrowButton } from "@/components/Buttons/RotateArrowButton";
import { useTokensList } from "@/hooks/useTokensList";
import { TokenList } from "@/components/TokenSelector/types/token";
import { useUserContext } from "@/contexts/UserContext";
import { TheButton } from "@/components/Buttons/TheButton";

export default function SwapPage() {
  const { address: userAddress } = useUserContext();
  const { tokensList, isLoading } = useTokensList();
  const [sellAmount, setSellAmount] = useState(1000);
  const [buyAmount, setBuyAmount] = useState(0);
  const [sellToken, setSellToken] = useState<TokenList | null>(null);
  const [buyToken, setBuyToken] = useState<TokenList | null>(null);
  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);

  const sellUsd = "$2.58M"; // TODO: need refator that and send the request to gett the current Value, for now I will keep loading.
  const buyUsd = "$0";

  useEffect(() => {
    if (!isLoading && tokensList.length > 0 && !sellToken) {
      setSellToken(tokensList[0]);
    }
  }, [isLoading]);

  const handleSwitchToken = () => {
    setIsTokenSwitched(!isTokenSwitched);
    setSellToken(buyToken);
    setBuyToken(sellToken);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-2">
      <div className="relative w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xl text-white sm:text-2xl">Swap</span>
          <button className="rounded-full p-1 transition hover:bg-[#8866DD]/20">
            <img
              src="/settingsIcon.a4bdfa44.svg"
              alt="Settings"
              width={38}
              height={38}
            />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative z-10">
            <SwapPanel
              label="Sell"
              amount={sellAmount}
              setAmount={setSellAmount}
              token={sellToken}
              usdValue={sellUsd}
              variant="default"
              onSelectToken={setSellToken}
            />

            <RotateArrowButton
              onClick={handleSwitchToken}
              className={cn(
                isTokenSwitched
                  ? "rotate-180 transition-transform duration-300"
                  : "rotate-0 transition-transform duration-300",
              )}
            />
          </div>
          <div>
            <SwapPanel
              label="Buy"
              amount={buyAmount}
              setAmount={setBuyAmount}
              token={buyToken}
              usdValue={buyUsd}
              variant="outline"
              onSelectToken={setBuyToken}
            />
          </div>
          <div className="flex flex-col">
            {!userAddress ? (
              <ConnectWallet className="flex w-full justify-center" />
            ) : (
              <TheButton
                disabled={!buyToken || !sellToken}
                className={cn(
                  "btn relative h-14 w-full rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80",
                )}
              >
                {!buyToken || !sellToken ? "Select a token" : "Swap"}
              </TheButton>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
