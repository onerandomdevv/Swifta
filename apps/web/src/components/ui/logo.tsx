import { cn } from "@/lib/utils";
import Link from "next/link";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
  variant?: "light" | "dark";
}

export function Logo({
  size = "md",
  showWordmark = true,
  className = "",
  variant = "light",
}: LogoProps) {
  const accentColor = "#00C853";

  const sizeMap: Record<string, { box: string; font: string; iconSize: string }> = {
    xs: { box: "h-5 w-5", font: "text-base", iconSize: "text-xs" },
    sm: { box: "h-6 w-6", font: "text-lg", iconSize: "text-sm" },
    md: { box: "h-8 w-8", font: "text-xl", iconSize: "text-base" },
    lg: { box: "h-10 w-10", font: "text-2xl", iconSize: "text-lg" },
  };

  const { box, font, iconSize } = sizeMap[size] || sizeMap.md;

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 transition-opacity hover:opacity-90", className)}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-lg font-bold text-white shadow-sm",
          box
        )}
        style={{ backgroundColor: accentColor }}
      >
        <span className={iconSize}>T</span>
      </div>
      {showWordmark && (
        <span
          className={cn(
            font,
            "font-bold tracking-tight text-foreground font-inter"
          )}
        >
          Twizrr
        </span>
      )}
    </Link>
  );
}
