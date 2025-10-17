"use client";

import Image from "next/image";
import { SupportedBy } from "./SupportedBy";
import { ContactSupport } from "./ContactSupport";

export const BridgeFooter = () => {
  return (
    <div className="mt-12 flex w-full max-w-md flex-col items-center gap-6 text-center">
      {/* Powered By */}
      <div className="flex items-center gap-2">
        <p className="text-foreground text-sm">Powered by</p>
        <a
          href="https://rozo.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          {/* Placeholder for powered by logo */}
          <Image
            src="/bridge/rozo-logo.png"
            alt="Rozo"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-xl font-bold text-white">ROZO</span>
        </a>
      </div>

      {/* Supported By */}
      <SupportedBy />

      {/* Legal Links */}
      <div className="flex items-center gap-4 text-sm">
        <a
          href="https://bridge.rozo.ai/privacy"
          className="text-foreground hover:text-primary transition-colors hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
        <span className="text-foreground">•</span>
        <a
          href="https://bridge.rozo.ai/terms"
          className="text-foreground hover:text-primary transition-colors hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Service
        </a>
      </div>

      {/* Help Contact */}
      <ContactSupport />
    </div>
  );
};
