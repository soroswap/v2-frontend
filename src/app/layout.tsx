import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, Darker_Grotesque } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { UserProvider } from "@/contexts";
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
        className={`${interSans.variable} ${darkerGrotesque.variable} font-sans antialiased`}
        style={{
          fontFamily:
            "var(--font-inter), var(--font-darker-grotesque), sans-serif",
        }}
      >
        <div className="bg-svg min-h-screen">
          <UserProvider>
            <Navbar />
            {children}
          </UserProvider>
        </div>
      </body>
    </html>
  );
}
