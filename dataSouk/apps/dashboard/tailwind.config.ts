import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#dc2626',
          light: '#fca5a5',
          dark: '#7f1d1d',
        },
        /** Dark theme tokens (flat keys to avoid resolver issues with @apply). */
        'noir-0': '#000000',
        'noir-900': '#070708',
        'noir-800': '#0d0e10',
        'noir-700': '#15171b',
        'noir-600': '#1d2026',
        'noir-500': '#262a32',
        'noir-400': '#3a3f4b',
        'noir-300': '#5a606e',
        'noir-200': '#9aa0ad',
        'noir-100': '#cdd1d9',
        'rouge-700': '#7f1d1d',
        'rouge-600': '#b91c1c',
        'rouge-500': '#dc2626',
        'rouge-400': '#ef4444',
        'rouge-300': '#fb7185',
        'rouge-200': '#fda4af',
        'rouge-100': '#fee2e2',
        cream: '#f4f0e8',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'system-ui', 'sans-serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 60px -20px rgba(220, 38, 38, 0.55)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
    },
  },
  plugins: [],
} satisfies Config;
