/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        "background-secondary": "hsl(var(--background-secondary) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-hover": "hsl(var(--surface-hover) / <alpha-value>)",
        "surface-elevated": "hsl(var(--surface-elevated) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        "foreground-secondary": "hsl(var(--foreground-secondary) / <alpha-value>)",
        "foreground-muted": "hsl(var(--foreground-muted) / <alpha-value>)",
        "foreground-inverse": "hsl(var(--foreground-inverse) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        "border-light": "hsl(var(--border-light) / <alpha-value>)",
        "border-input": "hsl(var(--border-input) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          hover: "hsl(var(--primary-hover) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        "deep-blue": "hsl(var(--deep-blue) / <alpha-value>)",
        "mid-blue": "hsl(var(--mid-blue) / <alpha-value>)",
        "accent-orange": "hsl(var(--accent-orange) / <alpha-value>)",
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        error: "hsl(var(--error) / <alpha-value>)",
        info: "hsl(var(--info) / <alpha-value>)",
        // Keep slate palette available for edge cases
        slate: require("tailwindcss/colors").slate,
        white: "#FFFFFF",
        black: "#000000",
        "background-light": "hsl(var(--background-light) / <alpha-value>)",
        "background-dark": "hsl(var(--background-dark) / <alpha-value>)",
        transparent: "transparent",
      },
      fontFamily: {
        display: ["DM Sans", "Inter", "sans-serif"],
        handwriting: ["Caveat", "cursive"],
      },
      boxShadow: {
        soft: "0 10px 40px -10px rgba(15, 43, 76, 0.08)",
        "hover-soft": "0 20px 50px -12px rgba(15, 43, 76, 0.12)",
      },
      keyframes: {
        "slide-in": {
          "0%": { opacity: 0, transform: "translateX(100%)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
