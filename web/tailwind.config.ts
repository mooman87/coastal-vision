import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5fbff',
          100: '#e6f5ff',
          200: '#c6e8ff',
          300: '#99d7ff',
          400: '#63c1ff',
          500: '#2ba6ff',
          600: '#1387e6',
          700: '#0f69b3',
          800: '#0f548d',
          900: '#0f466f'
        }
      },
      boxShadow: {
        soft: '0 10px 25px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: []
} satisfies Config;