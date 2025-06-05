"use client";
import Link from "next/link";
import ThemeSwitch from "./ThemeSwitch";
import React, { useState } from "react";
import ConnectWallet from "../Buttons/ConnectWallet";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { name: "Swap", href: "/" },
  { name: "Pools", href: "/pools" },
  { name: "Info", href: "https://dune.com/paltalabs/soroswap", external: true },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed text-3xl h-25 top-0 left-0 w-full z-50 bg-[#0f1016]">
      <nav className="flex items-center justify-between px-4 md:px-12 h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-[88px] min-h-[30px] max-w-[162px] max-h-[56px]">
          <Link href="/">
            <img
              src="/SoroswapPurpleWhite.svg"
              alt="Soroswap"
              width={162}
              height={56}
              className="object-contain h-[40px] w-auto"
              style={{ minWidth: 88, minHeight: 30 }}
            />
          </Link>
        </div>
        {/* Nav Links */}
        <div className="hidden md:flex items-center bg-[#181A25] rounded-full px-2 py-1 gap-2 ml-8">
          {NAV_LINKS.map((link) => {
            const isActive = !link.external && (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-6 py-2 rounded-full font-semibold text-[20px] transition-colors duration-200 ${
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
          <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-50">
            <button
              className="btn btn-circle h-14 w-14 bg-[#232136]"
              onClick={() => setMobileMenuOpen(true)}
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
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-50 bg-[#0f1016] flex flex-col items-center justify-start pt-24 transition-all duration-300 ease-out animate-navbar-slide"
              onClick={() => setMobileMenuOpen(false)}
            >
              <button
                className="absolute top-5 right-4 btn btn-circle h-14 w-14 bg-[#232136]"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(false);
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
                className="flex flex-col gap-8 w-full items-center mt-8"
                onClick={(e) => e.stopPropagation()}
              >
                <ThemeSwitch className="absolute top-5 right-22" />
                {NAV_LINKS.map((link) => {
                  const isActive = !link.external && (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href));
                  return (
                    <li key={link.name} className={`w-full ${isActive ? "bg-[#8866DD]" : "bg-[#0f1016]"} text-center`}>
                      <Link
                        href={link.href}
                        className={`block text-2xl font-bold py-4 w-full text-[#E0E0E0]`}
                        onClick={() => setMobileMenuOpen(false)}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                      >
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <ConnectWallet className="mt-10 w-[90%] flex justify-center" />
            </div>
          )}
        </>
        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Switch */}
          <ThemeSwitch className="hidden md:block" />
          {/* Connect Wallet Button */}
          <ConnectWallet className="hidden md:block"/>
        </div>
      </nav>
    </header>
  );
}
