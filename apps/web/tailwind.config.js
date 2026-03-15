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
        background: "var(--background)",
        "background-secondary": "var(--background-secondary)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        "surface-elevated": "var(--surface-elevated)",
        foreground: "var(--foreground)",
        "foreground-secondary": "var(--foreground-secondary)",
        "foreground-muted": "var(--foreground-muted)",
        "foreground-inverse": "var(--foreground-inverse)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        "border-input": "var(--border-input)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        "deep-blue": "var(--deep-blue)",
        "mid-blue": "var(--mid-blue)",
        "accent-orange": "var(--accent-orange)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
        // Keep slate palette available for edge cases
        slate: require("tailwindcss/colors").slate,
        white: "#FFFFFF",
        black: "#000000",
        "background-light": "var(--background-light)",
        "background-dark": "var(--background-dark)",
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
