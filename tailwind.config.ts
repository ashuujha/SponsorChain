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
        background: "#FAFAF8",
        foreground: "#1c1b1b",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-tertiary": "#ffffff",
        "on-error": "#ffffff",
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#444748",
        "on-background": "#1c1b1b",
        "on-primary-container": "#858383",
        "on-secondary-container": "#64625e",
        "on-tertiary-container": "#868381",
        "on-error-container": "#93000a",
        primary: {
          DEFAULT: "#000000",
          foreground: "#ffffff",
          fixed: "#e5e2e1",
          "fixed-dim": "#c8c6c5",
        },
        secondary: {
          DEFAULT: "#605e5a",
          foreground: "#ffffff",
          container: "#e3dfda",
          "on-container": "#64625e",
          fixed: "#e6e2dd",
          "fixed-dim": "#c9c6c1",
        },
        tertiary: {
          DEFAULT: "#000000",
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
          DEFAULT: "#FAFAF8",
          dim: "#ddd9d8",
          bright: "#fdf8f8",
          variant: "#e5e2e1",
          tint: "#5f5e5e",
          container: {
            lowest: "#ffffff",
            low: "#f7f3f2",
            DEFAULT: "#f1edec",
            high: "#ebe7e6",
            highest: "#e5e2e1",
          },
        },
        outline: {
          DEFAULT: "#747878",
          variant: "#E7E5E1",
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
        "container-max": "1200px",
      },
      spacing: {
        gutter: "20px",
        "container-max": "1200px",
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
