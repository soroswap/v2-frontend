"use client";

import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-surface-page px-4 py-6 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 lg:flex-row">
        {/* Left side - Navigation links */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-primary/80 transition-colors">
              Home
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary/80 transition-colors"
            >
              Terms of Use
            </Link>
            <Link
              href="/privacy"
              className="hover:text-primary/80 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Center - Copyright */}
          <div className="text-center">
            <p>©2025 Soroswap. All rights reserved.</p>
          </div>
        </div>

        {/* Right side - Social icons */}
        <div className="flex items-center gap-4">
          <Link
            href="https://docs.soroswap.finance"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Documentation"
          >
            <FileText size={20} />
          </Link>
          <Link
            href="https://dune.com/paltalabs/soroswap"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Dune Analytics"
          >
            <Image
              src="/footer/Dune.svg"
              alt="Dune Analytics"
              width={20}
              height={20}
            />
          </Link>
          <Link
            href="https://github.com/soroswap/v2-frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="GitHub"
          >
            <Image
              src="/footer/Github.svg"
              alt="GitHub"
              width={20}
              height={20}
              className="invert dark:invert-0"
            />
          </Link>
          <Link
            href="https://www.linkedin.com/company/paltalabs"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-400"
            aria-label="LinkedIn"
          >
            <Image
              src="/footer/Linkedin.svg"
              alt="LinkedIn"
              width={20}
              height={20}
              className="invert dark:invert-0"
            />
          </Link>
          <Link
            href="https://discord.gg/soroswap"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-indigo-400"
            aria-label="Discord"
          >
            <Image
              src="/footer/Discord.svg"
              alt="Discord"
              width={20}
              height={20}
              className="invert dark:invert-0"
            />
          </Link>
          <Link
            href="https://medium.com/soroswap"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="Medium"
          >
            <Image
              src="/footer/Medium.svg"
              alt="Medium"
              width={20}
              height={20}
              className="invert dark:invert-0"
            />
          </Link>
          <Link
            href="https://x.com/SoroswapFinance"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-400"
            aria-label="Twitter"
          >
            <Image
              src="/footer/Twitter.svg"
              alt="Twitter"
              width={20}
              height={20}
              className="invert dark:invert-0"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
};
