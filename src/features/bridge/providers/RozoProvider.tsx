"use client";

import { useUserContext } from "@/contexts";
import { getDefaultConfig, RozoPayProvider } from "@rozoai/intent-pay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { createConfig, WagmiProvider } from "wagmi";
import { BridgeLoader } from "../components/BridgeLoader";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Soroswap",
    appIcon: "https://app.soroswap.finance/SoroswapPurpleBlack.svg",
    appUrl: "https://app.soroswap.finance/",
  }),
);

const queryClient = new QueryClient();

export function RozoProvider({ children }: { children: ReactNode }) {
  const { kit } = useUserContext();
  const { resolvedTheme } = useTheme();

  // Avoid rendering provider while mounting to prevent setState during render in nested components
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const mode = useMemo(() => {
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [resolvedTheme]);

  // Wait until mounted and kit available
  if (!mounted || !kit) return <BridgeLoader />;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RozoPayProvider
          stellarKit={kit}
          stellarWalletPersistence={false}
          mode={mode}
        >
          {children}
        </RozoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
