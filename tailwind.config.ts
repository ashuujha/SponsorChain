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
      screens: {
        xs: "475px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: "#F5F5F5",
        "halo-dark": "#2B2644",
        "surface-soft": "#EBEBEB",
        "surface-card": "#FFFFFF",
        "surface-elevated": "#FFFFFF",
        hairline: "rgba(0, 0, 0, 0.08)",
        "hairline-strong": "rgba(0, 0, 0, 0.16)",
        "link-ice": "#1264a3",
        muted: "#555555",
        "muted-soft": "#777777",

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
        sm: "6px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        pill: "9999px",
        full: "9999px",
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.03em",
        tight: "-0.02em",
        "bugatti-wordmark": "6px",
        "bugatti-display": "4px",
        "bugatti-title": "2px",
        "bugatti-btn": "2.5px",
        "bugatti-caption": "2px",
      },
      maxWidth: {
        "container-max": "88rem",
      },
      fontFamily: {
        sans: ["TT Norms Pro", "Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Cormorant Garamond", "EB Garamond", "Garamond", "Times New Roman", "serif"],
        mono: ["ui-monospace", "SF Mono", "JetBrains Mono", "Cascadia Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

