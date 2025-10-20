"use client";

import { useUserContext } from "@/contexts";
import { getDefaultConfig, RozoPayProvider } from "@rozoai/intent-pay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { type ReactNode } from "react";
import { createConfig, WagmiProvider } from "wagmi";
import { BridgeLoader } from "../components/BridgeLoader";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Soroswap",
  }),
);

const queryClient = new QueryClient();

export function RozoProvider({ children }: { children: ReactNode }) {
  const { kit } = useUserContext();
  const { theme } = useTheme();

  if (!kit) return <BridgeLoader />;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RozoPayProvider
          stellarKit={kit}
          mode={theme === "dark" ? "dark" : "light"}
        >
          {children}
        </RozoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
