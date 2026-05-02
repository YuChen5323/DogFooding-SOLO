/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f8f9fa',
          100: '#e9ecef',
          200: '#dee2e6',
          300: '#ced4da',
          400: '#adb5bd',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#212529',
          900: '#1a1e22',
          950: '#0f1113',
        },
        landscape: {
          water: '#1a3a4c',
          mountain: '#2d3748',
          tree: '#1a4a3a',
          earth: '#5a4a3a',
          sky: '#a8c0d8',
          cloud: '#e8f0f8',
        },
        seasonal: {
          spring: '#4ade80',
          summer: '#22c55e',
          autumn: '#f59e0b',
          winter: '#e2e8f0',
        }
      },
      backgroundImage: {
        'ink-wash': 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,250,250,0.85) 100%)',
        'ink-panel': 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)',
      },
      boxShadow: {
        'ink': '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'ink-soft': '0 2px 12px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
