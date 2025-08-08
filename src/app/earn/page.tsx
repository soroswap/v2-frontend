"use client";

import { Plus } from "lucide-react";
import {
  PortfolioCard,
  VaultCard,
  VaultTable,
} from "@/features/earn/components";

export default function EarnPage() {
  return (
    <main className="mt-[100px] flex h-[calc(100vh-100px)] flex-col">
      <div className="flex h-full flex-col space-y-6">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <PortfolioCard />
            </div>

            <div>
              <VaultCard />
            </div>
          </div>
        </div>

        <div className="bg-surface-page border-surface-alt flex-1 rounded-lg border p-6">
          <div className="border-surface-alt flex items-center justify-between border-b p-6">
            <h2 className="text-primary text-xl font-bold">Vaults</h2>
            <button className="bg-surface-alt text-primary hover:bg-surface-hover flex items-center gap-2 rounded-lg px-4 py-2 transition-colors">
              <Plus className="size-4" />
              Vault
            </button>
          </div>

          <VaultTable />
        </div>
      </div>
    </main>
  );
}
