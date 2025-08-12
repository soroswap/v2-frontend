"use client";

import { Suspense } from "react";
import { PlusIcon } from "lucide-react";
import {
  PortfolioCard,
  VaultCard,
  VaultTable,
} from "@/features/earn/components";

const EarnPageSkeleton = () => (
  <main className="mt-[100px] flex h-[calc(100vh-100px)] flex-col">
    <div className="flex h-full flex-col space-y-6">
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-9">
            <div className="bg-surface border-surface-alt rounded-xl border p-4">
              <div className="skeleton mb-4 h-6 w-32" />
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex w-full gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="flex w-full flex-col gap-2 sm:w-fit"
                    >
                      <div className="skeleton h-4 w-16" />
                      <div className="skeleton h-6 w-20" />
                    </div>
                  ))}
                </div>
                <div className="skeleton h-10 w-40" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-surface border-surface-alt rounded-xl border p-4">
              <div className="space-y-2">
                <div className="skeleton h-6 w-32" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-page border-surface-alt flex-1 rounded-lg border p-6">
        <div className="border-surface-alt flex items-center justify-between border-b py-6 sm:p-6">
          <div className="skeleton h-6 w-16" />
          <div className="skeleton h-10 w-32" />
        </div>

        <div className="mt-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-surface border-surface-alt flex items-center gap-4 rounded-xl border p-4"
            >
              <div className="skeleton size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </main>
);

export default function EarnPage() {
  return (
    <Suspense fallback={<EarnPageSkeleton />}>
      <main className="mt-[100px] flex h-[calc(100vh-100px)] flex-col">
        <div className="flex h-full flex-col space-y-6">
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-9">
                <PortfolioCard />
              </div>
              <div className="lg:col-span-3">
                <VaultCard />
              </div>
            </div>
          </div>

          <div className="bg-surface-page border-surface-alt flex-1 rounded-lg border p-6">
            <div className="border-surface-alt flex items-center justify-between border-b py-6 sm:p-6">
              <h2 className="text-primary text-xl font-bold">Vaults</h2>
              <button
                className="bg-surface-alt text-primary hover:bg-surface-hover/70 flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 transition-colors"
                onClick={() => {
                  window.open(
                    "https://app.defindex.io",
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                Create Vault
                <PlusIcon className="size-4" />
              </button>
            </div>

            <VaultTable />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
