"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ThemeSwitch } from "@/components/Navbar/ThemeSwitch";
import { ConnectWallet } from "@/components/Buttons";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { name: "Swap", href: "/" },
  { name: "Pools", href: "/pools" },
  { name: "Earn", href: "/earn" },
  { name: "Info", href: "https://dune.com/paltalabs/soroswap", external: true },
];

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 z-50 h-25 w-full bg-[#0f1016] text-3xl">
      <nav className="flex h-full items-center justify-between px-4 md:px-12">
        {/* Logo */}
        <div className="flex max-h-[56px] min-h-[30px] max-w-[162px] min-w-[88px] items-center gap-3">
          <Link href="/">
            <Image
              src="/SoroswapPurpleWhite.svg"
              alt="Soroswap"
              width={162}
              height={56}
              className="h-[40px] w-auto object-contain"
              style={{ minWidth: 88, minHeight: 30 }}
            />
          </Link>
        </div>
        {/* Nav Links */}
        <div className="ml-8 hidden items-center gap-2 rounded-full bg-[#181A25] px-2 py-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              !link.external &&
              (link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`rounded-full px-6 py-2 text-[20px] font-semibold transition-colors duration-200 ${
                  isActive
                    ? "bg-[#8866DD] text-white shadow"
                    : "text-[#E0E0E0] hover:bg-[#28243a]"
                }`}
                style={{
                  color: isActive ? "#fff" : "#E0E0E0",
                  background: isActive ? "#8866DD" : "transparent",
                }}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
        {/* Mobile Nav Toggle */}
        <>
          <div className="absolute top-1/2 right-4 z-50 -translate-y-1/2 md:hidden">
            <button
              className="btn btn-circle h-14 w-14 bg-[#232136]"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          {isMobileMenuOpen && (
            <div
              className="animate-navbar-slide fixed inset-0 z-50 flex flex-col items-center justify-start bg-[#0f1016] pt-24 transition-all duration-300 ease-out"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <button
                className="btn btn-circle absolute top-5 right-4 h-14 w-14 bg-[#232136]"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(false);
                }}
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <ul
                className="mt-8 flex w-full flex-col items-center gap-8"
                onClick={(e) => e.stopPropagation()}
              >
                <ThemeSwitch className="absolute top-5 right-22" />
                {NAV_LINKS.map((link) => {
                  const isActive =
                    !link.external &&
                    (link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href));
                  return (
                    <li
                      key={link.name}
                      className={`w-full ${
                        isActive ? "bg-[#8866DD]" : "bg-[#0f1016]"
                      } text-center`}
                    >
                      <Link
                        href={link.href}
                        className={`block w-full py-4 text-2xl font-bold text-[#E0E0E0]`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                      >
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <ConnectWallet className="mt-10 flex w-[90%] justify-center" />
            </div>
          )}
        </>
        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Switch */}
          <ThemeSwitch className="hidden md:block" />
          {/* Connect Wallet Button */}
          <ConnectWallet className="hidden md:block" />
        </div>
      </nav>
    </header>
  );
};
