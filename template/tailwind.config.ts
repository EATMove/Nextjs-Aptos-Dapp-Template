import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6366f1",
          foreground: "#f9fafb",
          muted: "#a5b4fc",
        },
        surface: {
          DEFAULT: "rgba(15, 23, 42, 0.65)",
          highlight: "rgba(148, 163, 184, 0.2)",
        },
      },
      backgroundImage: {
        "grid-slate":
          "radial-gradient(circle at center, rgba(148, 163, 184, 0.15) 0, rgba(148, 163, 184, 0.05) 25%, transparent 60%), linear-gradient(120deg, rgba(79, 70, 229, 0.15), transparent)",
      },
      boxShadow: {
        card: "0 25px 50px -25px rgba(15, 23, 42, 0.7)",
      },
      borderRadius: {
        xl: "1.5rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [animatePlugin],
} satisfies Config;
