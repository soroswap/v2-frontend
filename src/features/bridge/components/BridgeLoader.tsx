import { RotateArrowButton } from "@/shared/components/buttons";
import { Loader2 } from "lucide-react";
import { Base, Stellar } from "./icons/chains";

export const BridgeLoader = () => {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-primary text-xl sm:text-2xl">Bridge</p>
        <div className="relative flex items-center justify-between gap-4">
          <Base width={40} height={40} />

          <RotateArrowButton
            className={
              "relative inset-0 translate-x-0 -rotate-90 transition-transform duration-300"
            }
            disabled
          />

          <Stellar width={40} height={40} className="rounded-full" />
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
