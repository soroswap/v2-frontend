/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { useState, useEffect, useCallback } from "react";
import {
  TheButton,
  RotateArrowButton,
  ConnectWallet,
  kit,
} from "@/components/shared/components/buttons";
import { SwapPanel } from "@/components/swap";
import { useTokensList } from "@/hooks/useTokensList";
import { useTokenPrice } from "@/hooks/useTokenPrice";
import { useUserContext } from "@/contexts";
import { SwapRouteSplitRequest, TokenType } from "@/components/shared/types";
import { STELLAR } from "@/lib/environmentVars";

export interface Swap {
  amount: number;
  usdValue: number | null;
  token: TokenType | null;
}

export default function SwapPage() {
  const { address: userAddress } = useUserContext();
  const { tokensList, isLoading } = useTokensList();
  const [isTokenSwitched, setIsTokenSwitched] = useState<boolean>(false);
  const [swap, setSwap] = useState<SwapRouteSplitRequest | null>(null);

  const [sell, setSell] = useState<Swap>({
    amount: 0,
    token: null,
    usdValue: null,
  });

  const [buy, setBuy] = useState<Swap>({
    amount: 0,
    token: null,
    usdValue: null,
  });

  const { price: sellPrice, isLoading: isSellPriceLoading } = useTokenPrice(
    sell.token?.contract || null,
  );
  const { price: buyPrice, isLoading: isBuyPriceLoading } = useTokenPrice(
    buy.token?.contract || null,
  );

  console.log("sellPrice", sellPrice);
  console.log("buyPrice", buyPrice);

  useEffect(() => {
    if (sellPrice !== null) {
      setSell((sell) => ({
        ...sell,
        usdValue: sellPrice * sell.amount,
      }));
    }
  }, [sellPrice, sell.amount]);

  useEffect(() => {
    if (buyPrice !== null) {
      setBuy((buy) => ({
        ...buy,
        usdValue: buyPrice * buy.amount,
      }));
    }
  }, [buyPrice, buy.amount]);

  useEffect(() => {
    if (!isLoading && tokensList.length > 0 && !sell.token) {
      setSell((prev) => ({
        ...prev,
        token: tokensList[0],
      }));
    }
  }, [isLoading, tokensList]);

  const handleSwitchToken = useCallback(() => {
    setIsTokenSwitched(!isTokenSwitched);

    const sellCopy = { ...sell };
    const buyCopy = { ...buy };

    setSell({
      amount: buyCopy.amount,
      token: buyCopy.token,
      usdValue: buyCopy.usdValue,
    });

    setBuy({
      amount: sellCopy.amount,
      token: sellCopy.token,
      usdValue: sellCopy.usdValue,
    });

    if (buyCopy.token && sellCopy.token) {
      setSwap({
        assetIn: buyCopy.token.contract,
        assetOut: sellCopy.token.contract,
        amount: (buyCopy.amount || 0).toString(),
        tradeType: "EXACT_IN",
        protocols: ["soroswap"],
        parts: 10,
        slippageTolerance: "50",
      });
    }
  }, [sell, buy, isTokenSwitched]);

  const handleSelectSellToken = useCallback((token: TokenType | null) => {
    if (token) {
      setSell((prev) => ({
        ...prev,
        token,
      }));
    }
  }, []);

  const handleSelectBuyToken = useCallback((token: TokenType | null) => {
    if (token) {
      setBuy((prev) => ({
        ...prev,
        token,
      }));
    }
  }, []);

  const handleSwap = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const swapResponse = await fetch("/api/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(swap),
      });

      if (!swapResponse.ok) {
        throw new Error(`HTTP error! status: ${swapResponse.status}`);
      }

      const swapResult = await swapResponse.json();
      console.log("Swap response:", swapResult);

      const buildXdrResponse = await fetch("/api/swap/buildXdr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
          to: "GALAXYVOIDAOPZTDLHILAJQKCVVFMD4IKLXLSZV5YHO7VY74IWZILUTO",
          tradeData: swapResult.data,
        }),
      });
      console.log("buildXdrResponse", buildXdrResponse);

      if (!buildXdrResponse.ok) {
        throw new Error(`HTTP error! status: ${buildXdrResponse.status}`);
      }

      const buildXdrResult = await buildXdrResponse.json();
      console.log("Build XDR response:", buildXdrResult);

      const { signedTxXdr } = await kit.signTransaction(`${buildXdrResult}`, {
        address: userAddress || "",
        networkPassphrase: STELLAR.WALLET_NETWORK,
      });

      console.log("signedTxXdr", signedTxXdr);

      const sendTransactionResponse = await fetch("/api/swap/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ xdr: signedTxXdr }),
      });

      if (!sendTransactionResponse.ok) {
        throw new Error(
          `HTTP error! status: ${sendTransactionResponse.status}`,
        );
      }

      const sendTransactionResult = await sendTransactionResponse.json();
      console.log("Send transaction response:", sendTransactionResult);
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-2">
      <div className="w-full max-w-[480px] rounded-2xl border border-[#8866DD] bg-[#181A25] p-4 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xl text-white sm:text-2xl">Swap</p>
          <button className="cursor-pointer rounded-full p-1 transition hover:bg-[#8866DD]/20">
            <Image
              src="/settingsIcon.svg"
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
              amount={sell.amount || 0}
              setAmount={(amount) => setSell((prev) => ({ ...prev, amount }))}
              token={sell.token}
              usdValue={sell.usdValue?.toString() || "0"}
              variant="default"
              onSelectToken={handleSelectSellToken}
              isLoading={isSellPriceLoading}
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
              amount={buy.amount || 0}
              setAmount={(amount) => setBuy((prev) => ({ ...prev, amount }))}
              token={buy.token}
              usdValue={buy.usdValue?.toString() || "0"}
              variant="outline"
              onSelectToken={handleSelectBuyToken}
              isLoading={isBuyPriceLoading}
            />
          </div>
          <div className="flex flex-col">
            {!userAddress ? (
              <ConnectWallet className="flex w-full justify-center" />
            ) : (
              <TheButton
                disabled={!buy.token || !sell.token}
                className={cn(
                  "btn relative h-14 w-full rounded-2xl bg-[#8866DD] p-4 text-[20px] font-bold hover:bg-[#8866DD]/80",
                )}
                onClick={handleSwap}
              >
                {!buy.token || !sell.token ? "Select a token" : "Swap"}
              </TheButton>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
