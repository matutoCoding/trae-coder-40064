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
        carbon: {
          50: "#f5f5f7",
          100: "#e5e5ea",
          200: "#c8c8d0",
          300: "#a0a0ae",
          400: "#75758a",
          500: "#55556b",
          600: "#424256",
          700: "#363647",
          800: "#2a2a3a",
          900: "#1a1a2e",
          950: "#0f0f1a",
        },
        accent: {
          DEFAULT: "#00d4ff",
          light: "#5ce1ff",
          dark: "#00a8cc",
        },
        warning: {
          DEFAULT: "#ff6b35",
          light: "#ff946b",
          dark: "#e55a2b",
        },
        success: {
          DEFAULT: "#00d26a",
          light: "#33db88",
          dark: "#00a854",
        },
        danger: {
          DEFAULT: "#ff4757",
          light: "#ff707d",
          dark: "#e63e4c",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"Microsoft YaHei"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },
      boxShadow: {
        "carbon": "0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "carbon-sm": "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "glow": "0 0 20px rgba(0, 212, 255, 0.3)",
        "glow-sm": "0 0 10px rgba(0, 212, 255, 0.2)",
      },
      backgroundImage: {
        "carbon-fiber": "repeating-linear-gradient(45deg, #1a1a2e 0px, #1a1a2e 2px, #252540 2px, #252540 4px)",
        "carbon-fiber-light": "repeating-linear-gradient(45deg, #2a2a3a 0px, #2a2a3a 2px, #35354a 2px, #35354a 4px)",
        "grid-pattern": "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "20px 20px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
