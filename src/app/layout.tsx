import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Darker_Grotesque } from "next/font/google";
import { UserProvider } from "@/contexts";
import { Navbar } from "@/features/navbar";
import "./globals.css";

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
    <html lang="en">
      <body
        className={`${interSans.variable} ${darkerGrotesque.variable} bg-svg font-sans antialiased`}
      >
        <UserProvider>
          <Navbar />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
