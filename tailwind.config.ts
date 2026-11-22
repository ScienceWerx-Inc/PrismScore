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
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
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
        ink: {
          DEFAULT: "#0b0a12",
          800: "#12101c",
          700: "#1b1828",
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

