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
        brand: {
          50: "#faf9f7",
          100: "#f5f3ef",
          200: "#e8e4dd",
          300: "#d4cdc2",
          400: "#b8af9e",
          500: "#9a8e79",
          600: "#857868",
          700: "#6d6356",
          800: "#5a5147",
          900: "#4a4339",
          950: "#282420",
        },
        accent: {
          gold: "#c9a962",
          "gold-light": "#e5d4a1",
          "gold-dark": "#a08840",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
