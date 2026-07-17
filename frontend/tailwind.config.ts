import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Core palette (light enterprise) ──────────────────────
        canvas:  "#F8FAFC",       // page background
        surface: "#FFFFFF",       // card / panel surfaces
        panel:   "#FFFFFF",       // sidebar
        border:  "#E5E7EB",       // subtle dividers
        muted:   "#F3F4F6",       // muted backgrounds

        // ── Brand (corporate blue) ────────────────────────────────
        brand: {
          DEFAULT: "#2563EB",
          dark:    "#1D4ED8",
          light:   "#3B82F6",
          subtle:  "#EFF6FF",
        },

        // ── Text ─────────────────────────────────────────────────
        text: {
          primary:   "#111827",
          secondary: "#4B5563",
          muted:     "#9CA3AF",
        },

        // ── Agent colours (light-mode) ────────────────────────────
        agent: {
          billing:   { bg: "#EFF6FF", fg: "#1D4ED8", dot: "#2563EB", ring: "rgba(37,99,235,0.15)" },
          technical: { bg: "#F5F3FF", fg: "#5B21B6", dot: "#7C3AED", ring: "rgba(124,58,237,0.15)" },
          product:   { bg: "#FFFBEB", fg: "#92400E", dot: "#D97706", ring: "rgba(217,119,6,0.15)" },
          complaint: { bg: "#FEF2F2", fg: "#991B1B", dot: "#DC2626", ring: "rgba(220,38,38,0.15)" },
          faq:       { bg: "#ECFDF5", fg: "#065F46", dot: "#059669", ring: "rgba(5,150,105,0.15)" },
        },

        // ── Sentiment colours (light-mode) ────────────────────────
        sentiment: {
          positive:   { bg: "#ECFDF5", fg: "#065F46", dot: "#059669" },
          neutral:    { bg: "#F9FAFB", fg: "#6B7280", dot: "#9CA3AF" },
          frustrated: { bg: "#FFFBEB", fg: "#92400E", dot: "#D97706" },
          angry:      { bg: "#FEF2F2", fg: "#991B1B", dot: "#DC2626" },
        },

        // ── Status ───────────────────────────────────────────────
        success: "#16A34A",
        warning: "#D97706",
        danger:  "#DC2626",
      },

      fontFamily: {
        display: ["var(--font-display)"],
        sans:    ["var(--font-sans)"],
        mono:    ["var(--font-mono)"],
      },

      borderRadius: {
        card: "8px",
        pill: "9999px",
      },

      boxShadow: {
        card:   "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        "card-md": "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
        "card-lg": "0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.04)",
        focus:  "0 0 0 3px rgba(37,99,235,0.15)",
      },

      animation: {
        "pulse-dot":  "pulseDot 2s ease-in-out infinite",
        "slide-up":   "slideUp 0.25s ease-out",
        "fade-in":    "fadeIn 0.3s ease-out",
        "shimmer":    "shimmer 1.4s linear infinite",
      },

      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(0.8)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  safelist: [
    { pattern: /bg-agent-(billing|technical|product|complaint|faq)-(bg|fg|dot|ring)/ },
    { pattern: /text-agent-(billing|technical|product|complaint|faq)-(bg|fg|dot|ring)/ },
    { pattern: /border-agent-(billing|technical|product|complaint|faq)-(bg|fg|dot|ring)/ },
    { pattern: /bg-sentiment-(positive|neutral|frustrated|angry)-(bg|fg|dot)/ },
    { pattern: /text-sentiment-(positive|neutral|frustrated|angry)-(bg|fg|dot)/ },
  ],
  plugins: [],
};
export default config;
