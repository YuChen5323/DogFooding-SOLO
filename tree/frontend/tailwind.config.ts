import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          '50': '#fdf8f3',
          '100': '#f9ede1',
          '200': '#f1d7ba',
          '300': '#e4b887',
          '400': '#d59359',
          '500': '#c87637',
          '600': '#b95f2d',
          '700': '#9a4a25',
          '800': '#7c3d23',
          '900': '#65341e',
          '950': '#361a0e',
        },
        bamboo: {
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#16a34a',
          '700': '#15803d',
          '800': '#166534',
          '900': '#14532d',
        },
        paper: {
          '50': '#fafaf8',
          '100': '#f5f5f0',
          '200': '#e7e7db',
          '300': '#d4d3c3',
          '400': '#b8b6a1',
          '500': '#9e9c85',
          '600': '#868470',
          '700': '#6e6c5c',
          '800': '#5b594e',
          '900': '#4d4b42',
        },
      },
      backgroundImage: {
        'wood-grain': "url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=subtle%20wood%20grain%20texture%20warm%20brown%20color%20natural%20pattern&image_size=square')",
      },
      fontFamily: {
        song: ['"Noto Serif SC"', 'serif'],
        kai: ['"Noto Serif SC"', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
