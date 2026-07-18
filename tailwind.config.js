/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme (default): bg #0A0A0A, card #111111, text #FAFAFA
        // Light theme: bg #FFFFFF, card #F4F4F5, text #09090B
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#0A0A0A',
        },
        card: {
          DEFAULT: '#F4F4F5',
          dark: '#111111',
        },
        accent: {
          DEFAULT: '#6366F1',
          muted: '#818CF8',
        },
        foreground: {
          DEFAULT: '#09090B',
          dark: '#FAFAFA',
        },
        muted: {
          DEFAULT: '#71717A',
          dark: '#A1A1AA',
        },
        line: {
          DEFAULT: '#E4E4E7',
          dark: '#27272A',
        },
      },
    },
  },
  plugins: [],
};
