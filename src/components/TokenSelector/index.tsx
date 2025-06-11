export type Token = {
  symbol: string;
  logo: string;
};

export default function TokenSelector({
  token,
  placeholder,
}: {
  token?: Token;
  /** fallback text when no token chosen */
  placeholder?: string;
}) {
  return (
    <button className="h-[43.5px] flex items-center gap-2 bg-[#23243a] border border-[#35374a] rounded-full py-1.5 px-1.5 sm:px-4 font-bold text-white text-xs sm:text-sm focus:outline-none whitespace-nowrap min-w-fit">
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
  );
}
