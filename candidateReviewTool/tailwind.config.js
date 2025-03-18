/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryGradient: "linear-gradient(90deg, #6E38E0 0%, #FF5F36 100%)",
        darkBg: "#151515",
        green: "#0OB85E",
        yellow: "#FFD928",
        grayText: "#898989",
        whiteText: "#FFFFFF",
      },
      fontFamily: {
        urbanist: ["Urbanist", "sans-serif"],
      },
    },
  },
  plugins: [],
};

