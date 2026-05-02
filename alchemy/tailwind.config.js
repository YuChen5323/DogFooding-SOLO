/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#f5f0e6',
          100: '#ebe4d4',
          200: '#d9c9a6',
          300: '#c7a77a',
          400: '#b88b5a',
          500: '#9c6f4a',
          600: '#7a563a',
          700: '#5c3f2a',
          800: '#3d291a',
          900: '#1f140a',
        },
        alchemy: {
          gold: '#d4af37',
          silver: '#c0c0c0',
          copper: '#b87333',
          fire: '#ff6b35',
          water: '#4a90d9',
          earth: '#8b6914',
          air: '#87ceeb',
          poison: '#7cfc00',
          dark: '#1a0a2e',
          light: '#fff8dc',
        },
      },
      fontFamily: {
        medieval: ['Georgia', 'Times New Roman', 'serif'],
        gothic: ['Courier New', 'monospace'],
      },
      backgroundImage: {
        'parchment-texture': "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"%3E%3Crect width=\"100\" height=\"100\" fill=\"%23f5f0e6\"/%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.1\"/%3E%3C/svg%3E')",
      },
    },
  },
  plugins: [],
}
