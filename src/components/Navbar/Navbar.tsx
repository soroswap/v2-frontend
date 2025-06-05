"use client";
import Link from "next/link";
import ThemeSwitch from "./ThemeSwitch";

const NAV_LINKS = [
  { name: "Swap", href: "/", active: true },
  { name: "Pools", href: "/pools" },
  { name: "Info", href: "https://dune.com/paltalabs/soroswap" },
];

export default function Navbar() {
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`px-6 py-2 rounded-full font-semibold text-[20px] transition-colors duration-200 ${
                link.active
                  ? "bg-[#8866DD] text-white shadow"
                  : "text-[#E0E0E0] hover:bg-[#28243a]"
              }`}
              style={{
                color: link.active ? "#fff" : "#E0E0E0",
                background: link.active ? "#8866DD" : "transparent",
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>
        {/* Mobile Nav Toggle */}
        <div className="md:hidden">
          <details className="dropdown">
            <summary className="btn btn-ghost btn-circle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            </summary>
            <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-[#232136] rounded-box w-40">
              {NAV_LINKS.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={
                      link.active
                        ? "text-[#8866DD] font-bold"
                        : "text-[#E0E0E0]"
                    }
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </div>
        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Switch */}
          <ThemeSwitch />
          {/* Connect Wallet Button (DaisyUI custom) */}
          <button className="hidden md:block btn h-14 bg-[#8866DD] rounded-[16px] text-[20px] p-[16px] font-bold">
            Connect Wallet
          </button>
        </div>
      </nav>
    </header>
  );
}
