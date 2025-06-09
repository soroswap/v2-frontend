import Image from "next/image";

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="rounded-2xl border border-[#8866DD] bg-[#181A25] shadow-xl p-8 w-[480px] relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-white text-2xl">Swap</span>
          <button className="p-2 rounded-full hover:bg-[#8866DD]/20 transition">
            <Image src="/settingsIcon.a4bdfa44.svg" alt="Settings" width={24} height={24} />
          </button>
        </div>
        {/* You sell panel */}
        <div className="bg-[#10121A] rounded-2xl p-5 mb-3">
          <div className="text-[#A0A3C4] text-sm mb-2">You sell</div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-[#23243a] rounded-full px-4 py-2 font-bold text-white text-lg">
              <img src="https://assets.coingecko.com/coins/images/100/standard/Stellar_symbol_black_RGB.png" alt="XLM logo" width={28} height={28} className="rounded-full" />
              <span>XLM</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-1">
                <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input
              className="flex-1 bg-transparent text-right text-2xl text-[#E0E0E0] placeholder:text-[#A0A3C4] outline-none opacity-40"
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
        <div className="bg-[#10121A] rounded-2xl p-5 mb-6 border border-[#23243a]">
          <div className="text-[#A0A3C4] text-sm mb-2">You receive</div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-[#8866DD] rounded-full px-4 py-2 font-bold text-white text-lg">
              <span>Select token</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="ml-1">
                <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input
              className="flex-1 bg-transparent text-right text-2xl text-[#E0E0E0] placeholder:text-[#A0A3C4] outline-none opacity-40"
              type="text"
              placeholder="0"
              disabled
            />
          </div>
        </div>
        {/* Connect Wallet Button */}
        <button className="w-full bg-[#A18AFF] hover:bg-[#8866DD] text-white text-2xl font-bold rounded-2xl py-5 transition mt-2">Connect Wallet</button>
      </div>
    </main>
  );
}
