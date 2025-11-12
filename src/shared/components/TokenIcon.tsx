import Image from "next/image";
import { cn } from "@/shared/lib/utils/cn";

interface TokenIconProps {
  src?: string;
  alt?: string;
  name?: string;
  code?: string;
  size?: number;
  className?: string;
}

/**
 * Generate a consistent random color based on a seed string
 * Uses a simple hash function to generate HSL colors with good contrast
 */
const getColorFromSeed = (seed?: string): string => {
  if (!seed) return "#8866DD"; // Default fallback

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate HSL color with good saturation and lightness
  const hue = Math.abs(hash % 360);
  const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
  const lightness = 45 + (Math.abs(hash >> 8) % 15); // 45-60%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export const TokenIcon = ({
  src,
  alt,
  name,
  code,
  size = 28,
  className,
}: TokenIconProps) => {
  const hasValidImage = src && src.trim() !== "" && src !== "undefined";

  // Get initials from name or code
  const getInitials = () => {
    if (code) {
      // Show first letter for single character codes, or first 3 for longer ones
      return code.length === 1 ? code.toUpperCase() : code.slice(0, 3).toUpperCase();
    }
    if (name) {
      const words = name.split(" ");
      if (words.length >= 3) {
        return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
      }
      // Show first letter for single character names, or first 3 for longer ones
      return name.length === 1 ? name.toUpperCase() : name.slice(0, 3).toUpperCase();
    }
    return "?";
  };

  // Generate consistent color from alt (contract address) or code
  const backgroundColor = getColorFromSeed(alt || code || name);

  if (hasValidImage) {
    return (
      <Image
        src={src}
        alt={alt || name || code || "Token"}
        width={size}
        height={size}
        className={cn("rounded-full bg-white", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(size * 0.35, 10),
        backgroundColor,
      }}
    >
      {getInitials()}
    </div>
  );
};
