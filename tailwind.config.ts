import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "on-primary": "var(--primary-text)",
        "on-secondary": "#ffffff",
        "on-surface": "var(--text-primary)",
        "on-surface-variant": "var(--text-secondary)",
        "on-background": "var(--text-primary)",

        // Slacc Brand Color Tokens
        aubergine: {
          DEFAULT: "#4a154b",
          deep: "#481a54",
          press: "#611f69",
          tint: "#592466",
          mute: "#d9bdde",
        },
        "link-blue": {
          DEFAULT: "#1264a3",
          hover: "#3860be",
        },
        "canvas-cream": "#f4ede4",
        "canvas-lavender": "#f9f0ff",

        primary: {
          DEFAULT: "var(--primary-bg)",
          foreground: "var(--primary-text)",
        },
        secondary: {
          DEFAULT: "var(--text-secondary)",
          foreground: "#ffffff",
        },
        surface: {
          DEFAULT: "var(--surface)",
          container: {
            DEFAULT: "var(--surface-container)",
            high: "var(--surface-hover)",
          },
        },
        outline: {
          DEFAULT: "var(--border-color)",
          variant: "var(--border-color)",
        },
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        pill: "90px",
        full: "9999px",
      },
      maxWidth: {
        "container-max": "1240px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Salesforce-Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
