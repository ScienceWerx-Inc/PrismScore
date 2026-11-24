import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Neutral greys re-tinted toward the ink navy-violet, so every `slate-*`
        // in the app pages matches the landing page's ink/paper neutrals.
        slate: {
          50: "#f8f7fa",
          100: "#f1f0f5",
          200: "#e3e1ea",
          300: "#cbc8d6",
          400: "#9794a8",
          500: "#646179",
          600: "#4d4a63",
          700: "#36334b",
          800: "#24213a",
          900: "#171530",
          950: "#0d0c1d",
        },
        // Primary accent used by the app pages: the prism violet
        brand: {
          50: "#f1eefe",
          100: "#e4defd",
          200: "#cfc6fb",
          300: "#ab9cf8",
          400: "#8b74fa",
          500: "#6d52f7",
          600: "#5b3df5",
          700: "#4c35de",
          800: "#3f28c9",
          900: "#2a1a8a",
          950: "#1a1060",
        },
        accent: {
          50: "#f5f3ff",
          100: "#ede9fe",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
        // Marketing surface (landing page + shared header/footer)
        paper: {
          DEFAULT: "#f6f4f1",
          deep: "#eeebe6",
        },
        // Text on paper, and the dark navy-violet bands
        ink: {
          DEFAULT: "#151329",
          800: "#1c1a35",
          700: "#26233f",
        },
        prism: {
          50: "#f1eefe",
          200: "#cfc6fb",
          300: "#ab9cf8",
          400: "#8b74fa",
          500: "#5b3df5",
          600: "#4c35de",
          700: "#3f28c9",
        },
      },
    },
  },
  plugins: [],
};
export default config;

