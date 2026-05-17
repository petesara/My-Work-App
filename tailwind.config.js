/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        navy: '#0D1117',
        'ca-red': '#CF2B1A',
        background: '#F5F3F0',
      },
    },
  },
  plugins: [],
}
