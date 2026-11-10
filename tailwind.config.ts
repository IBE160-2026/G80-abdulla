import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

// Temaet fra DESIGN.md i roten (UX-DR1–3). Fargene er variabler i
// app/globals.css. Radiusene og fontstørrelsene står eksplisitt her.
export default {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Statusfargene brukes bare på statusmerkene (DESIGN.md, Colors).
        status: {
          new: {
            DEFAULT: "hsl(var(--status-new))",
            foreground: "hsl(var(--status-new-foreground))",
          },
          progress: {
            DEFAULT: "hsl(var(--status-progress))",
            foreground: "hsl(var(--status-progress-foreground))",
          },
          done: {
            DEFAULT: "hsl(var(--status-done))",
            foreground: "hsl(var(--status-done-foreground))",
          },
          hidden: {
            DEFAULT: "hsl(var(--status-hidden))",
            foreground: "hsl(var(--status-hidden-foreground))",
          },
        },
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
      },
      // Systemfonten fra Tailwinds sans-stack. Brukes som text-title osv.
      // Klassenavnene står også i lib/utils.ts, så cn() vet at de er
      // fontstørrelser og ikke farger.
      fontSize: {
        title: ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        "card-title": ["15px", { lineHeight: "1.35", fontWeight: "600" }],
        meta: ["13px", { lineHeight: "1.4", fontWeight: "400" }],
        badge: ["12px", { lineHeight: "1.4", fontWeight: "600" }],
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
