/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
        },
        pos: {
          header: '#f8fafc',
          topbar: '#ffffff',
          sidebar: '#f1f5f9',
          border: '#e2e8f0',
          dark: '#0f172a',
          card: '#ffffff',
          accent: '#c53030',
          ready: '#10b981',
          pending: '#38bdf8',
          dispatched: '#f59e0b',
          cancelled: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
