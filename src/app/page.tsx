"use client";
import Image from "next/image";
import ConnectWallet from "@/components/Buttons/ConnectWallet";
import { useState } from "react";

export default function Home() {
  const [sellAmount, setSellAmount] = useState(1000);
  // Placeholder conversion rate for XLM to USD
  const sellUsd = "$2.58M";
  const [buyAmount, setBuyAmount] = useState(0);
  const buyUsd = "$0";

  return (
    <main className="flex items-center justify-center min-h-screen p-2">
      <div className="rounded-2xl border border-[#8866DD] bg-[#181A25] shadow-xl p-4 sm:p-8 w-full max-w-[480px] relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white text-xl sm:text-2xl">Swap</span>
          <button className="p-2 rounded-full hover:bg-[#8866DD]/20 transition">
            <Image src="/settingsIcon.a4bdfa44.svg" alt="Settings" width={24} height={24} />
          </button>
        </div>
        {/* Sell panel */}
        <div className="relative z-10">
          <div className="bg-[#10121A] rounded-2xl p-5 mb-3 border border-[#23243a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#A0A3C4] text-base font-medium">Sell</span>
              <button className="flex items-center gap-2 bg-[#23243a] border border-[#35374a] rounded-full px-2 py-1 font-bold text-white text-xs sm:text-sm focus:outline-none min-w-[90px]">
                <img src="https://assets.coingecko.com/coins/images/100/standard/Stellar_symbol_black_RGB.png" alt="XLM logo" width={20} height={20} className="rounded-full w-[20px] h-[20px]" />
                <span className="font-bold text-white text-sm">XLM</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-1">
                  <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col flex-1">
                <input
                  className="bg-transparent text-white text-3xl sm:text-4xl font-bold outline-none w-full p-0 m-0 leading-none hide-number-spin"
                  type="number"
                  value={sellAmount}
                  onChange={e => setSellAmount(Number(e.target.value))}
                  placeholder="0"
                  style={{ minWidth: 0 }}
                />
                <span className="text-[#A0A3C4] text-base sm:text-lg mt-1">{sellUsd}</span>
              </div>
            </div>
          </div>
          {/* Down arrow, absolutely positioned */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 z-20">
            <div className="bg-[#CFFFD9] rounded-full p-2 flex items-center justify-center border-4 border-[#181A25]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#232136" className="h-6 w-6">
                <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round" />
                <polyline points="19 12 12 19 5 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        {/* Buy panel */}
        <div className="mt-8">
          <div className="bg-[#10121A] rounded-2xl p-5 border border-[#23243a]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#A0A3C4] text-base font-medium">Buy</span>
              <button className="flex items-center gap-2 bg-[#8866DD] border border-[#8866DD] rounded-full px-2 py-1 font-bold text-white text-xs sm:text-sm focus:outline-none min-w-[110px]">
                <span className="font-bold text-white text-sm">Select token</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-1">
                  <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col flex-1">
                <input
                  className="bg-transparent text-white text-3xl sm:text-4xl font-bold outline-none w-full p-0 m-0 leading-none hide-number-spin"
                  type="number"
                  value={buyAmount}
                  onChange={e => setBuyAmount(Number(e.target.value))}
                  placeholder="0"
                  style={{ minWidth: 0 }}
                />
                <span className="text-[#A0A3C4] text-base sm:text-lg mt-1">{buyUsd}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Connect Wallet Button */}
        <ConnectWallet className="w-full flex justify-center mt-8" />
      </div>
    </main>
  );
}
