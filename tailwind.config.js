/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          600: "#2a3d52",
          700: "#1f2d3e",
          800: "#16212e",
          850: "#101822",
          900: "#0b1018",
          950: "#070a0f",
        },
        accent: {
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        warn: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        danger: {
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
        },
        success: {
          400: "#4ade80",
          500: "#22c55e",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', "ui-monospace", "monospace"],
        sans: ['"Inter"', "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
