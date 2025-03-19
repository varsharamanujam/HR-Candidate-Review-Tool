/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#151515",
        secondary: "#00B85E",
        purple: {
          DEFAULT: "#6E38E0",
          dark: "#5E2ED0",
        },
        orange: {
          DEFAULT: "#FF5F36",
          dark: "#FF4F26",
        },
        yellow: "#FFD923",
        gray: {
          900: "#151515",
          800: "#1E1E1E",
          700: "#333333",
          600: "#666666",
          500: "#898989",
          400: "#AAAAAA",
        },
      },
      fontFamily: {
        urbanist: ['Urbanist', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #6E38E0 0%, #FF5F36 100%)',
      },
      height: {
        screen: '100vh',
      },
      minHeight: {
        screen: '100vh',
      },
    },
  },
  plugins: [],
}

