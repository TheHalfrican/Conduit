import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        hub: {
          bg: "var(--hub-bg)",
          surface: "var(--hub-surface)",
          border: "var(--hub-border)",
          text: "var(--hub-text)",
          "text-dim": "var(--hub-text-dim)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        status: {
          success: "var(--status-success)",
          error: "var(--status-error)",
          running: "var(--status-running)",
          scheduled: "var(--status-scheduled)",
        },
        win: {
          white: "var(--win-white)",
          highlight: "var(--win-highlight)",
          shadow: "var(--win-shadow)",
          dark: "var(--win-dark)",
          "button-face": "var(--win-button-face)",
        },
      },
      fontFamily: {
        sans: ["Tahoma", '"MS Sans Serif"', "Arial", "sans-serif"],
        mono: ['"Courier New"', "Courier", "monospace"],
      },
      boxShadow: {
        "win-outset": "var(--shadow-outset)",
        "win-inset": "var(--shadow-inset)",
        "win-button": "var(--shadow-button)",
        "win-button-pressed": "var(--shadow-button-pressed)",
        "win-field": "var(--shadow-field)",
      },
    },
  },
  plugins: [],
} satisfies Config;
