import { envVars } from "@/shared/lib/environmentVars";
import { cn } from "@/shared/lib/utils";
import { Base, Polygon, Solana, Stellar } from "./icons/chains";

interface ChainLogo {
  type: string;
  component: React.ReactNode;
}

export type ChainType = "base" | "polygon" | "solana" | "stellar";

export const BridgeChainsStacked = ({
  excludeChains,
  className,
  size = 24,
  isTransitioning = false,
}: {
  excludeChains?: ChainType[];
  className?: string;
  size?: number;
  isTransitioning?: boolean;
}) => {
  const logoContainerClasses = "overflow-hidden rounded-full";
  const isTestnet = envVars.isTestnet.toString() === "true";

  const chainLogos: ChainLogo[] = [
    {
      type: "base",
      component: <Base width={size} height={size} testnet={isTestnet} />,
    },
    {
      type: "polygon",
      component: <Polygon width={size} height={size} testnet={isTestnet} />,
    },
    {
      type: "solana",
      component: <Solana width={size} height={size} testnet={isTestnet} />,
    },
    {
      type: "stellar",
      component: <Stellar width={size} height={size} testnet={isTestnet} />,
    },
  ];

  return (
    <div
      className={cn(
        "*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2",
        "transition-all duration-300 ease-in-out",
        isTransitioning && "scale-95 opacity-50",
        className,
      )}
    >
      {chainLogos
        .filter((logo) => !excludeChains?.includes(logo.type as ChainType))
        .map((logo, index) => (
          <div
            key={logo.type}
            className={cn(
              logoContainerClasses,
              "transition-all duration-200 ease-in-out",
              isTransitioning && "scale-95 transform opacity-70",
            )}
            style={{ zIndex: chainLogos.length - index }}
          >
            {logo.component}
          </div>
        ))}
    </div>
  );
};
