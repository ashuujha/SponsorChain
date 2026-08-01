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
        "on-tertiary": "#ffffff",
        "on-error": "#ffffff",
        "on-surface": "var(--text-primary)",
        "on-surface-variant": "var(--text-secondary)",
        "on-background": "var(--text-primary)",
        primary: {
          DEFAULT: "var(--primary-bg)",
          foreground: "var(--primary-text)",
          fixed: "#e5e2e1",
          "fixed-dim": "#c8c6c5",
        },
        secondary: {
          DEFAULT: "var(--text-secondary)",
          foreground: "#ffffff",
          container: "#e3dfda",
          "on-container": "#64625e",
          fixed: "#e6e2dd",
          "fixed-dim": "#c9c6c1",
        },
        tertiary: {
          DEFAULT: "var(--text-primary)",
          foreground: "#ffffff",
          container: "#1d1b1a",
          "on-container": "#868381",
          fixed: "#e6e1df",
          "fixed-dim": "#cac6c3",
        },
        error: {
          DEFAULT: "#ba1a1a",
          foreground: "#ffffff",
          container: "#ffdad6",
          "on-container": "#93000a",
        },
        surface: {
          DEFAULT: "var(--surface)",
          dim: "#ddd9d8",
          bright: "#fdf8f8",
          variant: "#e5e2e1",
          tint: "#5f5e5e",
          container: {
            lowest: "var(--surface)",
            low: "var(--surface-container)",
            DEFAULT: "var(--surface-container)",
            high: "var(--surface-hover)",
            highest: "var(--surface-hover)",
          },
        },
        outline: {
          DEFAULT: "var(--border-color)",
          variant: "var(--border-color)",
        },
        "inverse-surface": "#313030",
        "inverse-on-surface": "#f4f0ef",
        "inverse-primary": "#c8c6c5",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      maxWidth: {
        "container-max": "1280px",
      },
      spacing: {
        gutter: "20px",
        "container-max": "1280px",
        base: "4px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "48px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
