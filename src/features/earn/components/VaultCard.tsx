"use client";

import Image from "next/image";
import { TheButton } from "@/shared/components";

export const VaultCard = () => {
  return (
    <div className="bg-surface border-surface-alt relative overflow-hidden rounded-xl border p-4">
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/earn/vault.svg"
          alt="Vault background"
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-primary flex text-xl font-bold">
          Powered by Defindex
        </h2>
        <p className="text-secondary text-sm">
          Take control of your finances by creating your own Vault
        </p>

        <TheButton
          className="w-full text-white"
          onClick={() => {
            window.open(
              "https://app.defindex.io",
              "_blank",
              "noopener,noreferrer",
            );
          }}
        >
          Create Vault
        </TheButton>
      </div>
    </div>
  );
};
