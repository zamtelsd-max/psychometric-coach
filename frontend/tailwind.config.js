/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1B365D', light: '#2a4d80', dark: '#122748' },
        gold: { DEFAULT: '#D4AF37', light: '#e0c15a', dark: '#b8952a' },
        surface: '#F8F9FA',
        success: '#2E7D32',
        error: '#D32F2F',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
};
