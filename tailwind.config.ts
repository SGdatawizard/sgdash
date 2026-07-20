import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand tokens — Stanley Gibbons
        canvas: '#F7F4EC',      // primary — off white
        paper: '#FFFFFF',       // card surface
        navy: {
          DEFAULT: '#132345',   // secondary — deep navy
          light: '#1D3160',
          dark: '#0B1730',
        },
        gold: {
          DEFAULT: '#B8934A',   // tertiary — gold
          light: '#D4B876',
          dark: '#8F6E33',
        },
        ink: '#1A1D26',
        line: '#E4DECD',
        good: '#3F7A54',
        warn: '#B8934A',
        bad: '#AD4030',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Helvetica', 'Arial', 'sans-serif'],
        data: ['var(--font-data)', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        wide2: '0.14em',
        wide3: '0.22em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(19,35,69,0.06), 0 8px 24px -12px rgba(19,35,69,0.18)',
      },
      backgroundImage: {
        perf: 'radial-gradient(circle, transparent 3px, currentColor 3px)',
      },
    },
  },
  plugins: [],
};

export default config;
