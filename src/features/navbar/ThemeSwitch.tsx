"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = ({ className }: ThemeSwitchProps) => {
  const [isDark, setIsDark] = useState<boolean>(false);

  // Sync initial state with saved preference or system setting
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const shouldUseDark = stored === "dark" || (!stored && prefersDark);

    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);
  }, []);

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;

      // Apply/remove the `dark` class on <html>
      document.documentElement.classList.toggle("dark", next);

      // Persist user choice
      localStorage.setItem("theme", next ? "dark" : "light");

      return next;
    });
  };

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggleDark}
      className={cn(
        "bg-surface-subtle hover:bg-surface-alt relative flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-300",
        className,
      )}
    >
      {/* Sun icon */}
      <Sun
        className={cn(
          "text-accent-warning absolute size-10 transition-transform duration-300",
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0",
        )}
      />

      {/* Moon icon */}
      <Moon
        className={cn(
          "text-brand size-10 transition-transform duration-300",
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90",
        )}
      />
    </button>
  );
};
