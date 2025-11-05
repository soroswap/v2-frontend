"use client";

import { cn } from "@/shared/lib/utils/cn";
import { TokenIcon } from "@/shared/components";
import { Base, Stellar } from "./icons/chains";
import { envVars } from "@/shared/lib/environmentVars";

interface BridgeChainDisplayProps {
  chain: "stellar" | "base";
  className?: string;
}

const usdcToken = {
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  contract: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
  name: "USD Coin",
  org: "Centre Consortium LLC",
  domain: "centre.io",
  icon: "https://ipfs.io/ipfs/bafkreibpzncuhbk5ozhdw7xkcdoyf3xhwhcwcf6sj7axjzimxw6vm6pvyy",
  decimals: 7,
};

export const BridgeChainDisplay = ({
  chain,
  className,
}: BridgeChainDisplayProps) => {
  const isTestnet = envVars.isTestnet.toString() === "true";

  return (
    <div
      className={cn(
        "border-surface-alt bg-surface-alt text-primary flex h-[43.5px] min-w-fit cursor-default items-center gap-2 rounded-full border px-1.5 py-1.5 text-xs font-bold whitespace-nowrap sm:text-sm",
        className,
      )}
    >
      <TokenIcon
        src={usdcToken.icon}
        alt={`${usdcToken.name} logo`}
        name={usdcToken.name}
        code={usdcToken.code}
        size={29.5}
      />
      <p className="text-primary text-sm font-bold">{usdcToken.code}</p>
      <div className="flex items-center gap-1">
        <span className="text-secondary text-xs">on</span>
        {chain === "stellar" ? (
          <Stellar width={20} height={20} className="rounded-full" />
        ) : (
          <Base width={20} height={20} testnet={isTestnet} className="rounded-full" />
        )}
        <p className="text-primary text-sm font-bold capitalize">{chain}</p>
      </div>
    </div>
  );
};

