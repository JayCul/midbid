/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050505',
        abyss: '#0A0A0A',
        panel: '#111111',
        raised: '#171717',
        ember: { DEFAULT: '#FF8A00', deep: '#E86F00', soft: '#FFB347' },
        good: '#7BD88F',
        bad: '#FF6B6B',
      },
      opacity: { 4: '0.04', 8: '0.08', 12: '0.12', 16: '0.16', 28: '0.28', 48: '0.48', 72: '0.72' },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      fontSize: {
        hero: ['clamp(3.25rem, 10vw, 9rem)', { lineHeight: '0.9', letterSpacing: '-0.055em' }],
        display: ['clamp(2.5rem, 6vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '-0.045em' }],
        title: ['clamp(1.9rem, 3.6vw, 3.25rem)', { lineHeight: '1', letterSpacing: '-0.035em' }],
      },
      maxWidth: { canvas: '1320px' },
      transitionTimingFunction: { expo: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
};
