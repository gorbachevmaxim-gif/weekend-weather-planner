/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    colors: {
      "black": "#1E1E1E",
      "white": "#FFFFFF",
      "transparent": "transparent",
      "custom-gray": "#777777",
    },
    extend: {
      fontFamily: {
        unbounded: ['Unbounded', 'sans-serif'],
      },
      colors: {
        "pill-hover": "#E7E7E7",
        "neutral-400": "#777777",
      },
      fontSize: {
        "15": "15px",
        "11": "11px",
        "xs": "11px",
      },
      letterSpacing: {
        tighter: "-0.01em",
      },
      borderColor: {
        DEFAULT: "#F5F5F5"
      }
    },
  },
  plugins: [],
}
