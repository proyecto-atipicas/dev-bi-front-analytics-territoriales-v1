import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/modules/**/*.{ts,tsx}',
    './src/shared/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Tokens semánticos. Los valores reales se definen en globals.css
        // como CSS vars para soportar tema claro/oscuro.
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated) / <alpha-value>)',
        'surface-sunken': 'rgb(var(--surface-sunken) / <alpha-value>)',
        chrome: {
          DEFAULT: 'rgb(var(--chrome) / <alpha-value>)',
          foreground: 'rgb(var(--chrome-fg) / <alpha-value>)',
          muted: 'rgb(var(--chrome-muted) / <alpha-value>)',
          hover: 'rgb(var(--chrome-hover) / <alpha-value>)',
        },
        flag: {
          yellow: 'rgb(var(--flag-yellow) / <alpha-value>)',
          blue: 'rgb(var(--flag-blue) / <alpha-value>)',
          red: 'rgb(var(--flag-red) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        foreground: 'rgb(var(--fg) / <alpha-value>)',
        'foreground-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
        'foreground-subtle': 'rgb(var(--fg-subtle) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          foreground: 'rgb(var(--brand-fg) / <alpha-value>)',
          muted: 'rgb(var(--brand-muted) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          muted: 'rgb(var(--success-muted) / <alpha-value>)',
          foreground: 'rgb(var(--success-fg) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          muted: 'rgb(var(--danger-muted) / <alpha-value>)',
          foreground: 'rgb(var(--danger-fg) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          muted: 'rgb(var(--warning-muted) / <alpha-value>)',
          foreground: 'rgb(var(--warning-fg) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          muted: 'rgb(var(--info-muted) / <alpha-value>)',
          foreground: 'rgb(var(--info-fg) / <alpha-value>)',
        },
      },
      boxShadow: {
        // Sombras teñidas de navy (no gris neutro) para que los paneles
        // "pertenezcan" al lienzo gris-azul.
        soft: '0 1px 2px 0 rgb(35 45 75 / 0.05)',
        panel: '0 1px 2px 0 rgb(35 45 75 / 0.04), 0 2px 8px -2px rgb(35 45 75 / 0.06)',
        elevated:
          '0 8px 24px -6px rgb(35 45 75 / 0.14), 0 2px 6px -2px rgb(35 45 75 / 0.06)',
        focus: '0 0 0 3px rgb(var(--brand) / 0.18)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
