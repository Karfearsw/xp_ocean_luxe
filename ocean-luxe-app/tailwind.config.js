/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        gold: {
          50: "#fbf9ef",
          100: "#f6efdb",
          200: "#efe0b8",
          300: "#e6cf8e",
          400: "#ddbd60",
          500: "#d4af37",
          600: "#b3932b",
          700: "#8f7523",
          800: "#6d5a1d",
          900: "#4c3f17",
          950: "#2e2610",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
