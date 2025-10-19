"use client";

import { getDefaultConfig, RozoPayProvider } from "@rozoai/intent-pay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { createConfig, WagmiProvider } from "wagmi";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Soroswap",
  }),
);

const queryClient = new QueryClient();

export function RozoProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RozoPayProvider>{children}</RozoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
