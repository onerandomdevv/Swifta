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
        primary: "#00C853",
        "primary-dark": "#00A844",
        "deep-blue": "#0F2B4C",
        "mid-blue": "#1E3A5F",
        "primary-navy": "#0F2B4C",
        "accent-orange": "#E87722",
        "navy-dark": "#0F2B4C",
        brand: "#00C853",
        "neon-cyan": "#00C853",
        "accent-blue": "#2E75B6",
        "light-bg": "#F8FAFC",
        "light-green": "#4ADE80",
        "background-light": "#F8FAFC",
        "background-dark": "#0F2B4C",
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        accent: {
          DEFAULT: "#00C853",
          foreground: "#FFFFFF",
        },
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
