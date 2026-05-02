import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const colors = {
  dark: {
    900: '#0a0a0f',
    800: '#12121a',
    700: '#1a1a25',
    600: '#222230',
    500: '#2a2a3b',
  },
  accent: {
    50: '#fff7e6',
    100: '#ffe6b3',
    200: '#ffd680',
    300: '#ffc64d',
    400: '#ffb61a',
    500: '#ffa600',
    600: '#cc8500',
    700: '#996400',
    800: '#664200',
    900: '#332100',
  },
  danger: {
    500: '#ff4d4f',
    600: '#ff7875',
  },
  success: {
    500: '#52c41a',
  }
};

const fonts = {
  heading: '"Noto Serif SC", "Source Serif Pro", serif',
  body: '"Noto Sans SC", "Source Sans Pro", sans-serif',
  mono: '"Fira Code", monospace',
};

const styles = {
  global: {
    body: {
      bg: 'dark.900',
      color: 'gray.100',
      fontFamily: 'body',
      lineHeight: 'base',
    },
    '::selection': {
      bg: 'accent.500',
      color: 'dark.900',
    },
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'dark.800',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'dark.500',
      borderRadius: '4px',
      transition: 'background-color 0.2s',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: 'accent.500',
    },
  },
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'bold',
      borderRadius: 'md',
      transition: 'all 0.2s',
    },
    variants: {
      solid: {
        bg: 'accent.500',
        color: 'dark.900',
        _hover: {
          bg: 'accent.400',
        },
        _active: {
          bg: 'accent.600',
        },
      },
      outline: {
        borderColor: 'accent.500',
        color: 'accent.500',
        _hover: {
          bg: 'rgba(255, 166, 0, 0.1)',
        },
      },
      ghost: {
        color: 'gray.300',
        _hover: {
          bg: 'dark.600',
          color: 'accent.400',
        },
      },
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        bg: 'dark.800',
        border: '1px solid',
        borderColor: 'dark.500',
        borderRadius: 'lg',
        boxShadow: '2xl',
      },
      header: {
        color: 'accent.400',
        fontSize: 'xl',
        fontWeight: 'bold',
        borderBottom: '1px solid',
        borderColor: 'dark.500',
      },
      body: {
        color: 'gray.200',
      },
      footer: {
        borderTop: '1px solid',
        borderColor: 'dark.500',
      },
      overlay: {
        bg: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
      },
    },
  },
  Drawer: {
    baseStyle: {
      dialog: {
        bg: 'dark.800',
        border: 'none',
      },
      header: {
        color: 'accent.400',
        fontWeight: 'bold',
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        bg: 'dark.700',
        borderColor: 'dark.500',
        color: 'gray.100',
        _hover: {
          borderColor: 'dark.400',
        },
        _focus: {
          borderColor: 'accent.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-accent-500)',
        },
      },
    },
  },
  Textarea: {
    baseStyle: {
      bg: 'dark.700',
      borderColor: 'dark.500',
      color: 'gray.100',
      _hover: {
        borderColor: 'dark.400',
      },
      _focus: {
        borderColor: 'accent.500',
      },
    },
  },
  Select: {
    baseStyle: {
      field: {
        bg: 'dark.700',
        borderColor: 'dark.500',
        color: 'gray.100',
      },
    },
  },
  Divider: {
    baseStyle: {
      borderColor: 'dark.500',
    },
  },
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  styles,
  components,
});
