import "./globals.css";
import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Darker_Grotesque } from "next/font/google";
import { UserProvider } from "@/contexts";
import { Navbar } from "@/features/navbar";
import { ThemeProvider } from "next-themes";

const interSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const darkerGrotesque = Darker_Grotesque({
  variable: "--font-darker-grotesque",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Soroswap",
  description:
    "Soroswap Finance is a decentralized exchange on the Stellar blockchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interSans.variable} ${darkerGrotesque.variable} bg-main font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="soroswap-theme"
        >
          <UserProvider>
            <Navbar />
            {children}
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
