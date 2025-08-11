"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { TheButton } from "@/shared/components";

export const VaultCard = () => {
  const router = useRouter();
  return (
    <div className="bg-surface border-surface-alt relative overflow-hidden rounded-xl border p-4">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/earn/vault.svg"
          alt="Vault background"
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <h2 className="text-primary flex text-xl font-bold">
          Create your Vault
        </h2>
        <p className="text-secondary text-sm">
          Take control of your finances by creating your own Vault
        </p>

        <TheButton
          className="w-full"
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
