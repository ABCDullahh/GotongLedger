import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        headline: ["Epilogue", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        label: ["Space Grotesk", "monospace"],
      },
      colors: {
        /* Surface Hierarchy */
        surface: {
          DEFAULT: "#131314",
          dim: "#131314",
          "container-lowest": "#0E0E0F",
          "container-low": "#1C1B1C",
          container: "#201F20",
          "container-high": "#2A2A2B",
          "container-highest": "#353436",
          bright: "#3A393A",
        },

        /* Semantic Colors */
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "#FFB3AE",
          foreground: "#5D000A",
          container: "#FF5555",
          "fixed-dim": "#FFB3AE",
        },
        secondary: {
          DEFAULT: "#AED18D",
          foreground: "#34511B",
          container: "#34511B",
          "fixed-dim": "#AED18D",
        },
        destructive: {
          DEFAULT: "#FFB4AB",
          foreground: "hsl(var(--destructive-foreground))",
          container: "#93000A",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "#AED18D",
          foreground: "#34511B",
        },
        error: {
          DEFAULT: "#FFB4AB",
          container: "#93000A",
        },

        /* On-Surface */
        "on-surface": "#E5E2E3",
        "on-surface-variant": "#E3BEBB",

        /* Outline */
        outline: {
          DEFAULT: "#AA8986",
          variant: "#5A403E",
        },
        "on-primary-container": "#5D000A",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
