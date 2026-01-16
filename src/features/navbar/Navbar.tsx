"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ThemeSwitch } from "@/features/navbar";
import { ConnectWallet } from "@/shared/components/buttons";
import { AnnouncementDialog } from "@/shared/components/AnnouncementDialog";
import { getActiveAnnouncement } from "@/shared/lib/constants/announcements";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";

const NAV_LINKS = [
  { name: "Swap", href: "/" },
  { name: "Pools", href: "/pools" },
  { name: "Earn", href: "/earn" },
  { name: "Bridge", href: "/bridge" },
  { name: "Info", href: "https://dune.com/paltalabs/soroswap", external: true },
];

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const activeAnnouncement = getActiveAnnouncement();

  return (
    <header className="bg-surface-page fixed top-0 left-0 z-50 h-25 w-full text-3xl">
      <nav className="flex h-full items-center justify-between px-4 md:px-12">
        {/* Logo */}
        <div className="flex max-h-14 min-h-7 max-w-40 min-w-22 items-center gap-3">
          <Link href="/">
            <>
              <Image
                src="/SoroswapPurpleBlack.svg"
                alt="Soroswap"
                width={162}
                height={56}
                className="h-10 min-h-7 w-auto min-w-22 object-contain dark:hidden"
                priority
              />
              <Image
                src="/SoroswapPurpleWhite.svg"
                alt="Soroswap"
                width={162}
                height={56}
                className="hidden h-10 min-h-7 w-auto min-w-22 object-contain dark:block"
                priority
              />
            </>
          </Link>
        </div>
        {/* Nav Links */}
        <div className="bg-surface hidden items-center gap-2 rounded-full px-2 py-1 sm:flex sm:justify-center md:flex">
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
                className={cn(
                  "rounded-full px-6 py-2 text-xl font-semibold transition-colors duration-200",
                  isActive
                    ? "bg-brand text-white shadow"
                    : "hover:bg-brand/20 text-primary bg-transparent",
                )}
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
              className="bg-surface-alt inline-flex size-14 cursor-pointer items-center justify-center rounded-full"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-8" />
            </button>
          </div>
          {isMobileMenuOpen && (
            <div
              className="animate-navbar-slide bg-surface-page fixed inset-0 z-50 flex flex-col items-center justify-start pt-24 transition-all duration-300 ease-out"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <button
                className="bg-surface-alt absolute top-5 right-4 flex size-14 cursor-pointer items-center justify-center rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(false);
                }}
                aria-label="Close menu"
              >
                <X className="size-8" />
              </button>
              <ul
                className="mt-8 flex w-full flex-col items-center gap-8"
                onClick={(e) => e.stopPropagation()}
              >
                <ThemeSwitch className="absolute top-7 right-22" />
                {NAV_LINKS.map((link) => {
                  const isActive =
                    !link.external &&
                    (link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href));
                  return (
                    <li
                      key={link.name}
                      className={cn(
                        "w-full text-center",
                        isActive ? "bg-brand" : "bg-surface-page",
                      )}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          "text-primary block w-full py-4 text-2xl font-bold",
                          isActive
                            ? "bg-brand text-white shadow"
                            : "hover:bg-brand/20 text-primary bg-transparent",
                        )}
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
              <ConnectWallet className="flex w-[90%] justify-center" />
            </div>
          )}
        </>
        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Switch */}
          <ThemeSwitch />
          {/* Connect Wallet Button */}
          <ConnectWallet className="hidden md:block" />
        </div>
      </nav>

      {/* Announcement Dialog */}
      {activeAnnouncement && (
        <AnnouncementDialog announcement={activeAnnouncement} />
      )}
    </header>
  );
};
