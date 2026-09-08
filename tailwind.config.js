/**
 * Organic design system tokens. Light is the base; dark is applied by a `dark`
 * class on <html> (see resolveTheme in src/lib/theme.ts).
 */
const accent = {
  100: '#fff2eb', 200: '#ffe1d0', 300: '#ffc6a5', 400: '#f6a06b', 500: '#d67f48',
  600: '#b2622d', 700: '#8c491a', 800: '#643312', 900: '#402310', DEFAULT: '#c67139',
};
const accent2 = {
  100: '#f0fae1', 200: '#e1eecc', 300: '#ccdbb2', 400: '#aebf92', 500: '#8fa073',
  600: '#728157', 700: '#56633f', 800: '#3d472b', 900: '#272e1b', DEFAULT: '#7a8a5e',
};
const neutral = {
  100: '#f9f4ed', 200: '#eee7db', 300: '#dcd3c4', 400: '#c0b6a5', 500: '#a19786',
  600: '#82796a', 700: '#645c50', 800: '#474238', 900: '#2e2b25',
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Themed roles — driven by CSS variables so one `dark` class flips them all.
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--text) / <alpha-value>)',
        divider: 'var(--divider)',
        muted: 'var(--muted)',
        accent,
        accent2,
        neutral,
      },
      fontFamily: {
        display: ['Caprasimo', 'system-ui', 'sans-serif'],
        body: ['Figtree', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '32px', panel: '26px', inner: '24px', key: '22px', sheet: '36px' },
      boxShadow: {
        sm: '0 1px 2px rgba(46,43,37,.14)',
        md: '0 3px 10px rgba(46,43,37,.16)',
        lg: '0 12px 32px rgba(46,43,37,.22)',
        sheet: '0 -12px 32px rgba(46,43,37,.22)',
      },
      transitionTimingFunction: { sheet: 'cubic-bezier(.2,.8,.2,1)' },
    },
  },
  plugins: [],
};
