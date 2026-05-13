import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        priorityHigh: "#ef4444",
        priorityMid: "#f59e0b",
        priorityLow: "#10b981",
      },
    },
  },
  plugins: [],
} satisfies Config;
