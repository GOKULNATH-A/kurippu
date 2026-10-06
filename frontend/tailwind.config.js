/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // Main brand: Electric Violet-Blue
        brand: {
          50:  "#f0e8ff",
          100: "#ddd0ff",
          200: "#c0a8ff",
          300: "#9b74ff",
          400: "#7c3aff",
          500: "#6600ff",
          600: "#5500d4",
          700: "#4400ab",
          800: "#330080",
          900: "#220057",
          950: "#110030",
        },
        // Cyan accent
        cyan: {
          400: "#00e5ff",
          500: "#00c8e0",
          600: "#00aabf",
        },
        // Hot pink accent
        pink: {
          400: "#ff2d92",
          500: "#e0006e",
          600: "#c00059",
        },
        // Lime green accent
        lime: {
          400: "#39ff14",
          500: "#2cd10e",
          600: "#20a30a",
        },
        // Orange accent
        orange: {
          400: "#ff6b35",
          500: "#ff4500",
          600: "#d43800",
        },
        // Golden accent
        gold: {
          400: "#ffd700",
          500: "#e6c200",
          600: "#c4a600",
        },
        // Dark surface palette (slightly more colorful)
        surface: {
          DEFAULT: "#09090f",
          1: "#0f0f1a",
          2: "#141425",
          3: "#1a1a30",
          4: "#20203a",
          5: "#272745",
        },
        ink: {
          DEFAULT: "#f0f0ff",
          muted: "#9090b8",
          subtle: "#606088",
        },
      },
      borderRadius: {
        xl:  "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card:        "0 1px 4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        "card-hover":"0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)",
        glow:        "0 0 30px rgba(124,58,255,0.5)",
        "glow-cyan": "0 0 30px rgba(0,229,255,0.4)",
        "glow-pink": "0 0 30px rgba(255,45,146,0.4)",
        "glow-lime": "0 0 30px rgba(57,255,20,0.35)",
        "glow-gold": "0 0 30px rgba(255,215,0,0.4)",
      },
      backgroundImage: {
        "gradient-rainbow": "linear-gradient(135deg,#7c3aff,#ff2d92,#ff6b35,#ffd700,#39ff14,#00e5ff)",
        "gradient-hero":    "linear-gradient(135deg,#7c3aff 0%,#ff2d92 50%,#00e5ff 100%)",
        "gradient-brand":   "linear-gradient(135deg,#7c3aff,#00e5ff)",
        "gradient-warm":    "linear-gradient(135deg,#ff6b35,#ffd700,#ff2d92)",
        "gradient-cool":    "linear-gradient(135deg,#00e5ff,#7c3aff,#ff2d92)",
      },
      animation: {
        "fade-in":    "fadeIn 0.3s ease-out",
        "slide-up":   "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        shimmer:      "shimmer 1.5s infinite",
        float:        "float 4s ease-in-out infinite",
        "spin-slow":  "spin 8s linear infinite",
        rainbow:      "rainbowBg 6s linear infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        float:   { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        rainbowBg: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
    },
  },
  plugins: [],
};
