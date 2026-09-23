/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16335B',
          light: '#245599',
          dark: '#0f2542',
          50: '#eef3fb',
          600: '#1B4079',
          700: '#16335B',
        },
        gold: {
          DEFAULT: '#C99A2E',
          light: '#e0c15a',
          dark: '#b0851f',
          50: '#fbf5e6',
        },
        surface: '#f6f8fc',
        ink: '#0f172a',
        muted: '#64748b',
        success: '#15803d',
        warning: '#b45309',
        error: '#dc2626',
        info: '#0369a1',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { xl: '14px', '2xl': '20px' },
      boxShadow: {
        card: '0 2px 8px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)',
        md: '0 8px 24px rgba(15,23,42,.08)',
        lg: '0 18px 48px rgba(15,23,42,.12)',
      },
    },
  },
  plugins: [],
};
