import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1200px' } },
    extend: {
      colors: {
        navy: { DEFAULT: '#0E2A3B', 700: '#1B3F55', 900: '#081B27' },
        signal: { DEFAULT: '#FFC21A', dark: '#8F6A00', soft: '#FFF4D1' },
        tri: { DEFAULT: '#2F9E6E', soft: '#E3F4EC', dark: '#1F7A53' },
        kraft: '#F5F2EA',
        beton: { DEFAULT: '#8A9299', 600: '#5E676F' },
        line: '#E6E3DA',
      },
      fontFamily: {
        display: ['var(--font-archivo)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['clamp(3rem, 1.6rem + 6.2vw, 7.5rem)', { lineHeight: '0.95', letterSpacing: '-0.045em' }],
        h1: ['clamp(2.5rem, 1.6rem + 4vw, 5rem)', { lineHeight: '0.95', letterSpacing: '-0.045em' }],
        h2: ['clamp(2rem, 1.4rem + 2.8vw, 3.5rem)', { lineHeight: '0.95', letterSpacing: '-0.045em' }],
        h3: ['clamp(1.375rem, 1.2rem + 0.6vw, 1.75rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'body-lg': ['clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)', { lineHeight: '1.55' }],
        label: ['0.75rem', { lineHeight: '1', letterSpacing: '0.12em' }],
      },
      borderRadius: { btn: '14px', card: '24px', tile: '20px' },
      boxShadow: {
        soft: '0 1px 2px rgba(14,42,59,.06), 0 8px 24px -8px rgba(14,42,59,.12)',
        lift: '0 2px 4px rgba(14,42,59,.06), 0 24px 48px -16px rgba(14,42,59,.25)',
        signal: '0 10px 30px -8px rgba(255,194,26,.65)',
        'signal-lg': '0 16px 40px -6px rgba(255,194,26,.85)',
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'marquee-rev': { from: { transform: 'translateX(-50%)' }, to: { transform: 'translateX(0)' } },
        float: {
          '0%,100%': { transform: 'translateY(0) rotate(var(--r,0deg))' },
          '50%': { transform: 'translateY(-14px) rotate(calc(var(--r,0deg) + 3deg))' },
        },
      },
      animation: {
        marquee: 'marquee var(--dur,40s) linear infinite',
        'marquee-rev': 'marquee-rev var(--dur,40s) linear infinite',
        float: 'float var(--dur,8s) ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
