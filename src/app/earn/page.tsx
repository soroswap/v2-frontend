"use client";

import { Suspense } from "react";
import { PlusIcon } from "lucide-react";
import {
  // PortfolioCard,
  VaultCard,
  VaultTable,
} from "@/features/earn/components";
import { TheButton } from "@/shared/components";

const EarnPageSkeleton = () => (
  <main className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col pb-24">
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

      <div className="bg-surface-page/75 border-surface-alt mx-6 flex-1 rounded-lg border p-6 backdrop-blur-[25px]">
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
      <main className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col pb-24">
        <div className="flex h-full flex-col space-y-6">
          <div className="p-6">
            <div className="flex w-full">
              {/* This portfolio card it's commented for now. */}
              {/* <div className="lg:col-span-9">
                <PortfolioCard />
              </div> */}
              <div className="w-full flex-1">
                <VaultCard />
              </div>
            </div>
          </div>

          <div className="bg-surface-page/75 border-surface-alt mx-6 flex flex-1 flex-col rounded-lg border p-6 backdrop-blur-[25px]">
            <div className="border-surface-alt flex items-center justify-between border-b py-6 sm:p-6">
              <h2 className="text-primary text-xl font-bold">Vaults</h2>
              <TheButton
                className="border-brand text-brand hover:bg-brand/20 w-fit gap-2 border bg-transparent"
                onClick={() => {
                  window.open(
                    "https://app.defindex.io",
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
              >
                Create Vault
                <PlusIcon className="size-6" />
              </TheButton>
            </div>

            <VaultTable />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
