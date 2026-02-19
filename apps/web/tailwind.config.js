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
        primary: {
          DEFAULT: "#1B2A4A",
          light: "#2a3f6b",
        },
        accent: {
          DEFAULT: "#2E75B6",
          light: "#4a8ec9",
        },
        action: {
          DEFAULT: "#E87722",
          light: "#f09040",
        },
        success: {
          DEFAULT: "#16A34A",
        },
        warning: {
          DEFAULT: "#EAB308",
        },
        danger: {
          DEFAULT: "#DC2626",
        },
        border: "#E5E7EB",
        background: "#F9FAFB",
        card: "#FFFFFF",
      },
    },
  },
  plugins: [],
};
