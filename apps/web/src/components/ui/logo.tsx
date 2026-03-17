import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "xs" | "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

export function Logo({
  variant, // variant is now optional and can be ignored if we use classes
  size = "md",
  showWordmark = true,
  className = "",
}: LogoProps) {
  // Use currentColor or CSS variables for the dark blue parts
  const accentColor = "#00C853";

  const sizeMap = {
    xs: { svg: 22, text: "text-xs" },
    sm: { svg: 28, text: "text-base" },
    md: { svg: 36, text: "text-lg" },
    lg: { svg: 44, text: "text-2xl" },
  };

  const { svg, text } = sizeMap[size];
  const svgHeight = Math.round(svg * (30 / 44));

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={svg}
        height={svgHeight}
        viewBox="0 0 66 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect
          x="3"
          y="6"
          width="34"
          height="32"
          rx="16"
          stroke="currentColor"
          strokeWidth="5.5"
          fill="none"
          className="text-foreground"
        />
        <rect
          x="29"
          y="6"
          width="34"
          height="32"
          rx="16"
          stroke={accentColor}
          strokeWidth="5.5"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <span className={cn(text, "font-bold tracking-[-0.03em] font-display")}>
          <span className="text-foreground">Swift</span>
          <span style={{ color: accentColor }}>a</span>
        </span>
      )}
    </span>
  );
}
