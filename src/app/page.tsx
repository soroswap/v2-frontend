import Image from "next/image";
import ConnectWallet from "@/components/Buttons/ConnectWallet";

export default function Home() {
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
        {/* You sell panel */}
        <div className="bg-[#10121A] rounded-2xl p-4 sm:p-5 mb-3">
          <div className="text-[#A0A3C4] text-xs sm:text-sm mb-2">You sell</div>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <button className="flex items-center gap-2 bg-[#23243a] border border-[#35374a] rounded-full px-3 py-2 sm:px-4 sm:py-2 font-bold text-white text-base sm:text-lg focus:outline-none">
              <img src="https://assets.coingecko.com/coins/images/100/standard/Stellar_symbol_black_RGB.png" alt="XLM logo" width={28} height={28} className="rounded-full w-[28px] h-[28px]" />
              <span className="font-bold text-white text-lg">XLM</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-1">
                <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input
              className="flex-1 bg-transparent text-right text-xl sm:text-2xl text-[#E0E0E0] placeholder:text-[#A0A3C4] outline-none font-bold px-2 min-w-0 py-2"
              type="text"
              placeholder="0"
              disabled
            />
          </div>
        </div>
        {/* Down arrow */}
        <div className="flex justify-center my-2">
          <div className="bg-[#CFFFD9] rounded-full p-2 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#232136" className="h-6 w-6">
              <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round" />
              <polyline points="19 12 12 19 5 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        {/* You receive panel */}
        <div className="bg-[#10121A] rounded-2xl p-4 sm:p-5 mb-6 border border-[#23243a]">
          <div className="text-[#A0A3C4] text-xs sm:text-sm mb-2">You receive</div>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <button className="flex items-center gap-2 bg-[#8866DD] border border-[#8866DD] rounded-full px-3 py-2 sm:px-4 sm:py-2 font-bold text-white text-base sm:text-lg focus:outline-none">
              <span className="font-bold text-white text-lg">Select token</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-1">
                <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input
              className="flex-1 bg-transparent text-right text-xl sm:text-2xl text-[#E0E0E0] placeholder:text-[#A0A3C4] outline-none font-bold px-2 min-w-0 py-2"
              type="text"
              placeholder="0"
              disabled
            />
          </div>
        </div>
        {/* Connect Wallet Button */}
        <ConnectWallet className="w-full flex justify-center" />
      </div>
    </main>
  );
}
