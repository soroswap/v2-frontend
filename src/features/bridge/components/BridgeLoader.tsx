import { Loader2 } from "lucide-react";

export const BridgeLoader = () => {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-primary text-xl sm:text-2xl">Bridge</p>
      </div>

      <div className="flex flex-col items-center gap-4 py-8">
        <div className="space-y-3 text-center">
          <Loader2 className="text-secondary mx-auto size-12 animate-spin" />
          <p className="text-secondary text-sm">Loading bridge...</p>
        </div>
      </div>
    </div>
  );
};
