"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/lib/utils/cn";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = ({ className }: ThemeSwitchProps) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  const handleThemeToggle = () => {
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else {
      setTheme(isDark ? "light" : "dark");
    }
  };

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={handleThemeToggle}
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
