"use client";
import Image from "next/image";
import ConnectWallet from "@/components/Buttons/ConnectWallet";
import { useState } from "react";
import { Token } from "@/components/TokenSelector";
import SwapPanel from "@/components/SwapPanel";
import DownArrowButton from "@/components/Buttons/DownArrowButton";

export default function SwapPage() {
  const [sellAmount, setSellAmount] = useState(1000);
  const [buyAmount, setBuyAmount] = useState(0);

  const sellUsd = "$2.58M";
  const buyUsd = "$0";

  // Mock token data – will come from a token list later
  const sellToken: Token = {
    symbol: "XLM",
    logo: "https://ipfs.io/ipfs/QmXEkrYLhmVJCGJ9AhxQypF3eS4aUUQX3PTef31gmEfyJo/",
  };

  return (
    <main className="flex items-center justify-center min-h-screen p-2">
      <div className="rounded-2xl border border-[#8866DD] bg-[#181A25] shadow-xl p-4 sm:p-8 w-full max-w-[480px] relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white text-xl sm:text-2xl">Swap</span>
          <button className="p-1 rounded-full hover:bg-[#8866DD]/20 transition">
            <Image
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
            />

            <DownArrowButton />
          </div>
          <div className="">
            <SwapPanel
              label="Buy"
              amount={buyAmount}
              setAmount={setBuyAmount}
              usdValue={buyUsd}
              variant="outline"
            />
          </div>
        </div>
        <ConnectWallet
          className="w-full flex justify-center mt-8"
          label="Select a token"
        />
      </div>
    </main>
  );
}
