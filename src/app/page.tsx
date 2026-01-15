"use client";

import { RozoProvider } from "@/features/bridge/providers/RozoProvider";
import { StargateLayout } from "@/features/stargate-campaign/components";

export default function StargateCampaignPage() {
  return (
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <RozoProvider>
        <StargateLayout />
      </RozoProvider>
    </main>
  );
}
