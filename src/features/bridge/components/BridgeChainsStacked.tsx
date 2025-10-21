import { cn } from "@/shared/lib/utils";
import { Base, Polygon, Solana, Stellar } from "./icons/chains";

interface ChainLogo {
  type: string;
  component: React.ReactNode;
}

type ChainType = "base" | "polygon" | "solana" | "stellar";

export const BridgeChainsStacked = ({
  excludeChains,
  className,
  size = 24,
}: {
  excludeChains?: ChainType[];
  className?: string;
  size?: number;
}) => {
  // CSS classes for logo container
  const logoContainerClasses = "overflow-hidden rounded-full";

  const chainLogos: ChainLogo[] = [
    { type: "base", component: <Base width={size} height={size} /> },
    { type: "polygon", component: <Polygon width={size} height={size} /> },
    { type: "solana", component: <Solana width={size} height={size} /> },
    { type: "stellar", component: <Stellar width={size} height={size} /> },
  ];

  return (
    <div
      className={cn(
        "*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2",
        className,
      )}
    >
      {chainLogos
        .filter((logo) => !excludeChains?.includes(logo.type as ChainType))
        .map((logo, index) => (
          <div
            key={logo.type}
            className={logoContainerClasses}
            style={{ zIndex: chainLogos.length - index }}
          >
            {logo.component}
          </div>
        ))}
    </div>
  );
};
