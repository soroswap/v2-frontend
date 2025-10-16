import { Base, Polygon, Solana, Stellar } from "./icons/chains";

interface ChainLogo {
  type: string;
  component: React.ReactNode;
}

export default function ChainsStacked({
  excludeChains,
}: {
  excludeChains?: string[];
}) {
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
    <div className="-space-x-2 flex *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
      {chainLogos
        .filter((logo) => !excludeChains?.includes(logo.type))
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
}
