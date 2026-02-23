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
        foreground: "var(--foreground)",
        primary: "#10a24b",
        "primary-navy": "#1B2A4A",
        "accent-orange": "#E87722",
        "navy-dark": "#1b2a4b",
        brand: "#00f3ff",
        "neon-cyan": "#00f3ff",
        "accent-blue": "#2E75B6",
        "light-bg": "#F9FAFB",
        "background-light": "#f6f8f7",
        "background-dark": "#112117",
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        accent: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        handwriting: ["Caveat", "cursive"],
      },
      boxShadow: {
        soft: "0 10px 40px -10px rgba(27, 42, 74, 0.08)",
        "hover-soft": "0 20px 50px -12px rgba(27, 42, 74, 0.12)",
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
