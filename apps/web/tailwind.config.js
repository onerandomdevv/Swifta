/** @type {import('tailwindcss').Config} */
module.exports = {
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
        "primary-navy": "#1B2A4A",
        "accent-blue": "#2E75B6",
        "light-bg": "#F9FAFB",
        primary: {
          DEFAULT: "#0F172A", // Slate 900
          foreground: "#F8FAFC", // Slate 50
        },
        secondary: {
          DEFAULT: "#F1F5F9", // Slate 100
          foreground: "#0F172A",
        },
        accent: {
          DEFAULT: "#2563EB", // Blue 600
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -10px rgba(27, 42, 74, 0.08)",
        "hover-soft": "0 20px 50px -12px rgba(27, 42, 74, 0.12)",
      },
    },
  },
  plugins: [],
};
