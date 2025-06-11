import { useState } from "react";
export type Token = {
  symbol: string;
  logo: string;
};

export default function TokenSelector({
  token,
  placeholder,
  onSelect,
}: {
  token?: Token;
  placeholder?: string;
  onSelect?: (t: Token) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Mock token list – replace with real list later
  const TOKENS: Token[] = [
    {
      symbol: "XLM",
      logo:
        "https://ipfs.io/ipfs/QmXEkrYLhmVJCGJ9AhxQypF3eS4aUUQX3PTef31gmEfyJo/",
    },
    {
      symbol: "USDC",
      logo:
        "https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png",
    },
    {
      symbol: "USDT",
      logo:
        "https://assets.coingecko.com/coins/images/325/thumb/Tether.png",
    },
    {
      symbol: "WBTC",
      logo:
        "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
    },
    {
      symbol: "ETH",
      logo:
        "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",
    },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`h-[43.5px] flex items-center gap-2 bg-[#23243a] border border-[#35374a] rounded-full py-1.5 px-1.5 font-bold text-white text-xs sm:text-sm focus:outline-none whitespace-nowrap min-w-fit ${token ? "sm:px-1.5" : "sm:px-4"}`}
      >
        {token ? (
          <>
            <img
              src={token.logo}
              alt={`${token.symbol} logo`}
              width={29.5}
              height={29.5}
              className="rounded-full bg-white"
            />
            <span className="font-bold text-white text-sm">{token.symbol}</span>
          </>
        ) : (
          <span className="font-bold text-white text-sm">
            {placeholder ?? "Select token"}
          </span>
        )}
        {/* down‑chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="ml-1"
        >
          <polyline
            points="6 9 12 15 18 9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Sheet */}
          <div className="relative z-50 w-full max-w-xs sm:max-w-sm max-h-[70vh] bg-[#181A25] border border-[#35374a] rounded-2xl p-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-medium text-lg">
                Select a token
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            {/* Token list */}
            <div className="overflow-y-auto overscroll-contain space-y-2 pr-1">
              {TOKENS.map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => {
                    onSelect?.(t);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-[#23243a] transition"
                >
                  <img
                    src={t.logo}
                    alt={t.symbol}
                    width={28}
                    height={28}
                    className="rounded-full bg-white"
                  />
                  <span className="text-white font-medium">{t.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
