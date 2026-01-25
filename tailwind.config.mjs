/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        luxury: {
          cream: '#f5f0e6',
          champagne: '#f7e7ce',
          gold: '#d4af37',
          darkGold: '#b8860b',
          bronze: '#cd7f32',
        }
      },
    },
  },
  plugins: [],
}
