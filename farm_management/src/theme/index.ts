import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  pixel: {
    50: '#FFF8E7',
    100: '#FFE4B5',
    200: '#FFDAB9',
    300: '#F4A460',
    400: '#DEB887',
    500: '#D2691E',
    600: '#CD853F',
    700: '#8B4513',
    800: '#654321',
    900: '#3E2723',
  },
  grass: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  dirt: {
    50: '#EFEBE9',
    100: '#D7CCC8',
    200: '#BCAAA4',
    300: '#A1887F',
    400: '#8D6E63',
    500: '#795548',
    600: '#6D4C41',
    700: '#5D4037',
    800: '#4E342E',
    900: '#3E2723',
  },
  water: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },
  season: {
    spring: '#90EE90',
    summer: '#FFD700',
    autumn: '#D2691E',
    winter: '#ADD8E6',
  },
};

const fonts = {
  heading: "'Press Start 2P', monospace",
  body: "'Press Start 2P', monospace",
  mono: "'Press Start 2P', monospace",
};

const fontSizes = {
  '2xs': '0.5rem',
  xs: '0.6rem',
  sm: '0.7rem',
  md: '0.8rem',
  lg: '0.9rem',
  xl: '1rem',
  '2xl': '1.2rem',
  '3xl': '1.4rem',
  '4xl': '1.6rem',
  '5xl': '1.8rem',
  '6xl': '2rem',
};

const components = {
  Button: {
    baseStyle: {
      fontFamily: 'mono',
      fontWeight: 'bold',
      textTransform: 'none',
    },
    variants: {
      pixel: {
        bg: 'pixel.400',
        color: 'white',
        border: '4px solid',
        borderColor: 'pixel.600',
        boxShadow: '4px 4px 0px #00000040',
        _hover: {
          bg: 'pixel.500',
          transform: 'translate(-2px, -2px)',
          boxShadow: '6px 6px 0px #00000040',
        },
        _active: {
          bg: 'pixel.600',
          transform: 'translate(2px, 2px)',
          boxShadow: '2px 2px 0px #00000040',
        },
      },
      'pixel-outline': {
        bg: 'transparent',
        color: 'pixel.600',
        border: '4px solid',
        borderColor: 'pixel.600',
        _hover: {
          bg: 'pixel.100',
        },
      },
    },
    defaultProps: {
      variant: 'pixel',
    },
  },
  Card: {
    baseStyle: {
      container: {
        border: '4px solid',
        borderColor: 'pixel.400',
        borderRadius: '0px',
        boxShadow: '4px 4px 0px #00000040',
        bg: 'pixel.50',
      },
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        border: '4px solid',
        borderColor: 'pixel.500',
        borderRadius: '0px',
        boxShadow: '8px 8px 0px #00000040',
        bg: 'pixel.50',
      },
      overlay: {
        bg: 'blackAlpha.600',
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        border: '4px solid',
        borderColor: 'pixel.400',
        borderRadius: '0px',
        bg: 'white',
        fontFamily: 'mono',
        _focus: {
          borderColor: 'pixel.500',
          boxShadow: 'none',
        },
      },
    },
  },
  Select: {
    baseStyle: {
      field: {
        border: '4px solid',
        borderColor: 'pixel.400',
        borderRadius: '0px',
        bg: 'white',
        fontFamily: 'mono',
      },
    },
  },
  Progress: {
    baseStyle: {
      track: {
        bg: 'pixel.200',
        border: '2px solid',
        borderColor: 'pixel.400',
        borderRadius: '0px',
      },
      filledTrack: {
        bg: 'pixel.500',
        borderRadius: '0px',
      },
    },
  },
  Badge: {
    baseStyle: {
      fontFamily: 'mono',
      border: '2px solid',
      borderRadius: '0px',
    },
    variants: {
      pixel: {
        bg: 'pixel.300',
        borderColor: 'pixel.500',
        color: 'pixel.800',
      },
    },
    defaultProps: {
      variant: 'pixel',
    },
  },
  Tabs: {
    baseStyle: {
      tab: {
        fontFamily: 'mono',
        fontWeight: 'bold',
        border: '4px solid',
        borderBottom: 'none',
        borderColor: 'pixel.400',
        borderRadius: '0px',
        _selected: {
          bg: 'pixel.300',
          borderBottom: 'none',
        },
      },
      tablist: {
        borderBottom: '4px solid',
        borderColor: 'pixel.400',
      },
    },
  },
};

const styles = {
  global: {
    body: {
      bg: 'pixel.100',
      color: 'pixel.900',
      fontFamily: 'mono',
      fontSize: 'xs',
      lineHeight: 'tall',
    },
    '::selection': {
      bg: 'pixel.400',
      color: 'white',
    },
    '*': {
      scrollbarWidth: 'thin',
      scrollbarColor: 'pixel.400 pixel.100',
    },
    '*::-webkit-scrollbar': {
      width: '12px',
      height: '12px',
    },
    '*::-webkit-scrollbar-track': {
      bg: 'pixel.100',
      border: '2px solid',
      borderColor: 'pixel.300',
    },
    '*::-webkit-scrollbar-thumb': {
      bg: 'pixel.400',
      border: '2px solid',
      borderColor: 'pixel.500',
    },
  },
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  components,
  styles,
});
