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
  const backgroundColor = "#8866DD";

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
