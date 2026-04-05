/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        },
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        surface: 'rgb(var(--color-card) / <alpha-value>)',
        section: 'rgb(var(--color-section) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        'foreground-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'foreground-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        
        // Legacy aliases to prevent 404s/broken styles in older components
        background: 'rgb(var(--color-background) / <alpha-value>)',
        'background-secondary': 'rgb(var(--color-section) / <alpha-value>)',
        'background-light': 'rgb(var(--color-background) / <alpha-value>)',
        'background-dark': 'rgb(var(--color-card) / <alpha-value>)',
        'surface-hover': 'rgb(var(--color-section) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--color-card) / <alpha-value>)',
        'foreground-muted': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        'foreground-inverse': 'rgb(var(--color-background) / <alpha-value>)',
        'border-light': 'rgb(var(--color-border) / <alpha-value>)',
        'border-input': 'rgb(var(--color-border) / <alpha-value>)',
        'deep-blue': 'rgb(var(--color-secondary) / <alpha-value>)',
        'mid-blue': 'rgb(var(--color-secondary) / <alpha-value>)',
        'accent-orange': 'rgb(var(--color-accent) / <alpha-value>)',
        ring: 'rgb(var(--color-primary) / <alpha-value>)',
        
        slate: require('tailwindcss/colors').slate,
        white: '#FFFFFF',
        black: '#000000',
        transparent: 'transparent',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        soft: '0 10px 40px -10px rgba(15, 43, 76, 0.08)',
        'hover-soft': '0 20px 50px -12px rgba(15, 43, 76, 0.12)',
      },
      keyframes: {
        'slide-in': {
          '0%': { opacity: 0, transform: 'translateX(100%)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};