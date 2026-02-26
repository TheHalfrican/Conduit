import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        hub: {
          bg: "#0c0c14",
          surface: "#161625",
          border: "#2a2a3d",
          text: "#e2e2ef",
          "text-dim": "#8888a0",
        },
        accent: {
          DEFAULT: "#00d4aa",
          hover: "#00eabb",
        },
        status: {
          success: "#00d4aa",
          error: "#ff4466",
          running: "#4488ff",
          scheduled: "#aa66ff",
        },
      },
      fontFamily: {
        sans: ['"JetBrains Mono"', "monospace"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
