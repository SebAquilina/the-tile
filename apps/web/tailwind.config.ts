import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Every colour maps to a CSS custom property defined in app/tokens.css.
        canvas: "var(--color-canvas)",
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        "surface-muted": "var(--color-surface-muted)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        "ink-subtle": "var(--color-ink-subtle)",
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
          subtle: "var(--color-text-subtle)",
        },
        line: "var(--color-line)",
        umber: "var(--color-umber)",
        "umber-strong": "var(--color-umber-strong)",
        brand: {
          DEFAULT: "var(--color-brand)",
          strong: "var(--color-brand-strong)",
        },
        clay: "var(--color-clay)",
        accent: "var(--color-accent)",
        cream: "var(--color-cream)",
        focus: "var(--color-focus)",
        "focus-ring": "var(--color-focus-ring)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        body: "var(--font-body)",
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
        "6xl": "var(--text-6xl)",
      },
      spacing: {
        "space-1": "var(--space-1)",
        "space-2": "var(--space-2)",
        "space-3": "var(--space-3)",
        "space-4": "var(--space-4)",
        "space-5": "var(--space-5)",
        "space-6": "var(--space-6)",
        "space-7": "var(--space-7)",
        "space-8": "var(--space-8)",
        "space-9": "var(--space-9)",
        "space-10": "var(--space-10)",
        "space-11": "var(--space-11)",
        "space-12": "var(--space-12)",
        "space-16": "var(--space-16)",
        "space-20": "var(--space-20)",
        "space-24": "var(--space-24)",
      },
      borderRadius: {
        none: "var(--radius-none)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)",
        full: "var(--radius-pill)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        med: "var(--duration-med)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
      },
      maxWidth: {
        prose: "var(--measure-prose)",
        content: "var(--measure-content)",
        wide: "var(--measure-wide)",
      },
      outlineColor: {
        focus: "var(--color-focus)",
      },
      ringColor: {
        focus: "var(--color-focus-ring)",
      },
      keyframes: {
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "toast-in": "toast-in 200ms var(--ease-out) both",
        shimmer: "shimmer 1.6s linear infinite",
        "spin-slow": "spin-slow 900ms linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
