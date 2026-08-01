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
        canvas: "#000000",
        "surface-soft": "#0d0d0d",
        "surface-card": "#141414",
        "surface-elevated": "#1f1f1f",
        hairline: "#262626",
        "hairline-strong": "#3a3a3a",
        "link-ice": "#c3d9f3",
        muted: "#999999",
        "muted-soft": "#666666",

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
        none: "0px",
        DEFAULT: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        pill: "9999px",
        full: "9999px",
      },
      letterSpacing: {
        "bugatti-wordmark": "6px",
        "bugatti-display": "4px",
        "bugatti-title": "2px",
        "bugatti-btn": "2.5px",
        "bugatti-caption": "2px",
      },
      maxWidth: {
        "container-max": "1280px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Saira Condensed", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Cormorant Garamond", "EB Garamond", "Garamond", "Times New Roman", "serif"],
        mono: ["ui-monospace", "SF Mono", "JetBrains Mono", "Cascadia Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
