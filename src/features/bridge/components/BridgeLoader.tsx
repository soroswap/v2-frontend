import { ArrowRight, Loader2 } from "lucide-react";
import { BridgeChainsStacked } from "./BridgeChainsStacked";
import { Stellar } from "./icons/chains";

export const BridgeLoader = () => {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-primary text-xl sm:text-2xl">Bridge</p>
        <div className="flex items-center gap-4">
          <BridgeChainsStacked excludeChains={["stellar"]} />

          <div className="m-auto flex items-center justify-center">
            <ArrowRight size={20} />
          </div>

          <Stellar width={24} height={24} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-8">
        <div className="space-y-3 text-center">
          <Loader2 className="text-secondary mx-auto size-12 animate-spin" />
        </div>
      </div>
    </div>
  );
};
