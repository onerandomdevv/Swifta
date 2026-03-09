interface LogoProps {
  variant?: "light" | "dark";
  size?: "xs" | "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

export function Logo({
  variant = "light",
  size = "md",
  showWordmark = true,
  className = "",
}: LogoProps) {
  const leftRingColor = variant === "dark" ? "white" : "#0F2B4C";
  const swiftColor = variant === "dark" ? "white" : "#0F2B4C";

  const sizeMap = {
    xs: { svg: 22, text: "text-xs" },
    sm: { svg: 28, text: "text-base" },
    md: { svg: 36, text: "text-lg" },
    lg: { svg: 44, text: "text-2xl" },
  };

  const { svg, text } = sizeMap[size];
  const svgHeight = Math.round(svg * (30 / 44));

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={svg}
        height={svgHeight}
        viewBox="0 0 66 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="6"
          width="34"
          height="32"
          rx="16"
          stroke={leftRingColor}
          strokeWidth="5.5"
          fill="none"
        />
        <rect
          x="29"
          y="6"
          width="34"
          height="32"
          rx="16"
          stroke="#00C853"
          strokeWidth="5.5"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <span className={`${text} font-bold tracking-[-0.03em] font-display`}>
          <span style={{ color: swiftColor }}>Swift</span>
          <span style={{ color: "#00C853" }}>Trade</span>
        </span>
      )}
    </span>
  );
}
