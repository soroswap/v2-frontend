import TokenSelector, { Token } from "@/components/TokenSelector";

/* -------------------------------------------------------------------------- */
/*                                Components                                  */
/* -------------------------------------------------------------------------- */
/** Generic panel used for both “Sell” & “Buy” */
export default function SwapPanel({
  label,
  amount,
  setAmount,
  token,
  usdValue,
  variant = "default",
}: {
  label: string;
  amount: number;
  setAmount: (v: number) => void;
  token?: Token;
  usdValue: string;
  variant?: "default" | "outline";
}) {
  const baseClasses = "rounded-2xl p-5 border";
  const styles =
    variant === "outline"
      ? "bg-transparent border-[#cfffd966]"
      : "bg-[#10121A] border-[#23243a]";

  return (
    <div className={`${baseClasses} ${styles}`}>
      {/* Panel header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#A0A3C4] text-base font-medium">{label}</span>
        {/* 25% / 50% / MAX controls could live here later */}
      </div>

      {/* Amount + token */}
      <div className="flex items-end justify-between max-h-[43.5px]">
        <input
          className="bg-transparent text-white text-3xl sm:text-4xl font-bold outline-none w-full p-0 m-0 leading-none hide-number-spin"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="0"
          style={{ minWidth: 0 }}
        />

        <TokenSelector token={token} placeholder="Select token" />
      </div>

      {/* USD helper */}
      <div className="flex items-end justify-between">
        <span className="text-[#A0A3C4] text-base sm:text-lg mt-1">
          {usdValue}
        </span>
      </div>
    </div>
  );
}