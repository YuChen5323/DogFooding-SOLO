import { createTheme } from '@mantine/core';

export const theme = createTheme({
  colors: {
    metalBlack: [
      '#f5f5f5',
      '#e0e0e0',
      '#bbbbbb',
      '#949494',
      '#6a6a6a',
      '#4a4a4a',
      '#333333',
      '#1a1a1a',
      '#0d0d0d',
      '#000000',
    ],
    metalYellow: [
      '#fff9e6',
      '#fff2cc',
      '#ffe599',
      '#ffd966',
      '#ffcc33',
      '#ffb800',
      '#cc9300',
      '#996e00',
      '#664900',
      '#332500',
    ],
  },
  primaryColor: 'metalYellow',
  primaryShade: 5,
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  headings: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '700',
  },
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        root: {
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    Card: {
      styles: {
        root: {
          background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
          border: '1px solid #3a3a3a',
        },
      },
    },
    Input: {
      styles: {
        input: {
          backgroundColor: '#2a2a2a',
          borderColor: '#3a3a3a',
          color: '#ffffff',
          '&:focus': {
            borderColor: '#ffb800',
          },
        },
      },
    },
    Select: {
      styles: {
        input: {
          backgroundColor: '#2a2a2a',
          borderColor: '#3a3a3a',
          color: '#ffffff',
        },
      },
    },
    Text: {
      styles: {
        root: {
          color: '#ffffff',
        },
      },
    },
    Title: {
      styles: {
        root: {
          color: '#ffb800',
        },
      },
    },
  },
});
