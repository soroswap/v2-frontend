import { Loader2 } from "lucide-react";
import { BridgeToggle } from "./BridgeToggle";

export const BridgeLoader = () => {
  return (
    <div className="flex w-full flex-col gap-6">
      <BridgeToggle disabled bridgeMode="deposit" onModeChange={() => {}} />

      <div className="flex flex-col items-center gap-4 py-8">
        <div className="space-y-3 text-center">
          <Loader2 className="text-secondary mx-auto size-12 animate-spin" />
        </div>
      </div>
    </div>
  );
};
