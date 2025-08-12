"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";

import { VaultCardDetails } from "@/features/earn/components/VaultCardDetails";
import { VaultManagePanel } from "@/features/earn/components/VaultManagePanel";

const VaultPageSkeleton = () => (
  <div className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col px-4 py-8">
    <div className="mx-auto w-full max-w-6xl">
      {/* VaultCardDetails skeleton */}
      <div className="bg-surface border-surface-alt flex flex-col gap-4 rounded-2xl border p-8 shadow-lg">
        {/* Back button skeleton */}
        <div className="flex items-center gap-4">
          <div className="skeleton h-10 w-10 rounded-lg" />
          <div className="skeleton h-4 w-12" />
        </div>

        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="skeleton size-16 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-4 w-32" />
          </div>
        </div>

        {/* Metrics grid skeleton */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-6 w-24" />
            </div>
          ))}
        </div>

        {/* Contract address skeleton */}
        <div className="bg-surface-subtle flex items-center justify-between rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-80" />
          </div>
          <div className="skeleton size-8" />
        </div>
      </div>

      {/* VaultManagePanel skeleton */}
      <div className="bg-surface border-surface-alt mt-8 rounded-2xl border p-8 shadow-lg">
        {/* Tabs skeleton */}
        <div className="mb-6 flex gap-2">
          <div className="skeleton h-8 w-20" />
          <div className="skeleton h-8 w-24" />
        </div>

        <div className="border-surface-alt border-t pt-6">
          {/* Form skeleton */}
          <div className="space-y-6">
            <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center">
              {/* From wallet skeleton */}
              <div className="flex flex-col gap-2 lg:flex-1">
                <div className="skeleton h-4 w-20" />
                <div className="bg-surface-alt border-surface-alt h-12 rounded-lg border" />
                <div className="skeleton h-3 w-24" />
              </div>

              {/* Amount skeleton */}
              <div className="flex flex-col gap-2 lg:flex-1">
                <div className="skeleton h-4 w-16" />
                <div className="bg-surface-alt border-surface-alt h-12 rounded-lg border" />
                <div className="skeleton h-3 w-20" />
              </div>

              {/* Arrow skeleton */}
              <div className="hidden items-center justify-center lg:flex">
                <div className="skeleton size-6" />
              </div>

              {/* To vault skeleton */}
              <div className="flex flex-col gap-2 lg:flex-1">
                <div className="skeleton h-4 w-16" />
                <div className="bg-surface-alt border-surface-alt h-12 rounded-lg border" />
                <div className="skeleton h-3 w-12" />
              </div>
            </div>

            {/* Button skeleton */}
            <div className="pt-4">
              <div className="skeleton h-12 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function VaultPageDetails() {
  const params = useParams();
  const vaultAddress = params.vaultAddress as string;

  return (
    <Suspense fallback={<VaultPageSkeleton />}>
      <div className="mt-[100px] flex min-h-[calc(100vh-100px)] flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-6xl">
          <VaultCardDetails vaultAddress={vaultAddress} />
          <VaultManagePanel vaultAddress={vaultAddress} />
          // TODO: Create a about showing the FeebPG, Assets and roles
        </div>
      </div>
    </Suspense>
  );
}
