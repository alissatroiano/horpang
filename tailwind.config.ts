import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,html}'],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        bone: '#e8e4d8',
        crimson: { DEFAULT: '#8b0000', dark: '#320000' },
        'exit-green': '#39ff14',
        gray: {
          300: '#b8b8b8',
          500: '#7a7a7a',
          700: '#3a3a3a',
          900: '#141414',
        },
      },
      fontFamily: {
        horror: ['"Road Rage"', 'Creepster', 'cursive'],
        body: ['"Special Elite"', 'monospace'],
      },
      keyframes: {
        drip: {
          '0%': { transform: 'translateY(-10%)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(110%)', opacity: '0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        drip: 'drip 2s ease-in infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        shake: 'shake 0.4s linear',
      },
    },
  },
  plugins: [],
} satisfies Config;
