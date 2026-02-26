import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        hub: {
          bg: "#c0c0c0",
          surface: "#d4d0c8",
          border: "#808080",
          text: "#000000",
          "text-dim": "#808080",
        },
        accent: {
          DEFAULT: "#0054e3",
          hover: "#0066ff",
        },
        status: {
          success: "#008000",
          error: "#ff0000",
          running: "#0054e3",
          scheduled: "#800080",
        },
        win: {
          white: "#ffffff",
          highlight: "#ffffff",
          shadow: "#808080",
          dark: "#404040",
          "title-start": "#0a246a",
          "title-end": "#3a6ea5",
          "button-face": "#d4d0c8",
        },
      },
      fontFamily: {
        sans: ["Tahoma", '"MS Sans Serif"', "Arial", "sans-serif"],
        mono: ['"Courier New"', "Courier", "monospace"],
      },
      boxShadow: {
        "win-outset":
          "inset 1px 1px 0 #ffffff, inset -1px -1px 0 #404040, inset 2px 2px 0 #d4d0c8, inset -2px -2px 0 #808080",
        "win-inset":
          "inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #404040, inset -2px -2px 0 #d4d0c8",
        "win-button":
          "inset 1px 1px 0 #ffffff, inset -1px -1px 0 #404040, inset 2px 2px 0 #d4d0c8, inset -2px -2px 0 #808080",
        "win-button-pressed":
          "inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #404040, inset -2px -2px 0 #d4d0c8",
        "win-field":
          "inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #404040, inset -2px -2px 0 #d4d0c8",
      },
    },
  },
  plugins: [],
} satisfies Config;
