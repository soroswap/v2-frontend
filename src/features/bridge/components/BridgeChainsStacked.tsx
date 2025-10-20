import { Base, Polygon, Solana, Stellar } from "./icons/chains";

interface ChainLogo {
  type: string;
  component: React.ReactNode;
}

type ChainType = "base" | "polygon" | "solana" | "stellar";

export const BridgeChainsStacked = ({
  excludeChains,
}: {
  excludeChains?: ChainType[];
}) => {
  // CSS classes for logo container
  const logoContainerClasses =
    "border overflow-hidden rounded-full border-background";

  const chainLogos: ChainLogo[] = [
    { type: "base", component: <Base width={24} height={24} /> },
    { type: "polygon", component: <Polygon width={24} height={24} /> },
    { type: "solana", component: <Solana width={24} height={24} /> },
    { type: "stellar", component: <Stellar width={24} height={24} /> },
  ];

  return (
    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2">
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
