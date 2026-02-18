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
    },
  },
  plugins: [],
};
