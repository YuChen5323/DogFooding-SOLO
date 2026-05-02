import { create } from 'zustand';
import type { 
  AppState, 
  KeyboardLayout, 
  KeyboardKey, 
  ComponentLibrary, 
  FirmwareConfig, 
  TypingStats,
  Switch,
  Keycap,
  MCU,
  MatrixConfig
} from '../types';

const mockSwitches: Switch[] = [
  { id: '1', name: 'Cherry MX Red', type: 'linear', force: 45, travel: 4.0, color: '#FF0000', brand: 'Cherry', feelScore: 8.5 },
  { id: '2', name: 'Cherry MX Blue', type: 'clicky', force: 55, travel: 4.0, color: '#0066FF', brand: 'Cherry', feelScore: 7.8 },
  { id: '3', name: 'Cherry MX Brown', type: 'tactile', force: 55, travel: 4.0, color: '#8B4513', brand: 'Cherry', feelScore: 8.2 },
  { id: '4', name: 'Gateron Yellow', type: 'linear', force: 50, travel: 4.0, color: '#FFFF00', brand: 'Gateron', feelScore: 8.0 },
  { id: '5', name: 'Kailh Box White', type: 'clicky', force: 55, travel: 4.0, color: '#FFFFFF', brand: 'Kailh', feelScore: 7.5 },
];

const mockKeycaps: Keycap[] = [
  { id: '1', name: 'GMK Olivia', material: 'ABS', profile: 'Cherry', colors: ['#2D2D2D', '#E8E8E8'], legendStyle: 'doubleshot' },
  { id: '2', name: 'GMK WoB', material: 'ABS', profile: 'Cherry', colors: ['#000000', '#FFFFFF'], legendStyle: 'doubleshot' },
  { id: '3', name: 'PBTfans Nautilus', material: 'PBT', profile: 'OEM', colors: ['#1B3A4B', '#E63946'], legendStyle: 'padprint' },
  { id: '4', name: 'DSA Milk', material: 'PBT', profile: 'DSA', colors: ['#F5F5DC', '#333333'], legendStyle: 'laser' },
];

const mockMCUs: MCU[] = [
  { id: '1', name: 'ATmega32U4', pins: ['D0', 'D1', 'D2', 'D3', 'D4', 'C6', 'D7', 'E6', 'B4', 'B5', 'B6', 'B2', 'B3', 'B1', 'F7', 'F6', 'F5', 'F4', 'F1', 'F0'], firmwareType: 'QMK', supported: true },
  { id: '2', name: 'RP2040', pins: ['GP0', 'GP1', 'GP2', 'GP3', 'GP4', 'GP5', 'GP6', 'GP7', 'GP8', 'GP9', 'GP10', 'GP11', 'GP12', 'GP13', 'GP14', 'GP15', 'GP16', 'GP17', 'GP18', 'GP19', 'GP20', 'GP21', 'GP22', 'GP26', 'GP27', 'GP28'], firmwareType: 'ZMK', supported: true },
  { id: '3', name: 'ATmega328P', pins: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'C0', 'C1', 'C2', 'C3', 'C4', 'C5'], firmwareType: 'QMK', supported: false },
];

const mockLibrary: ComponentLibrary = {
  switches: mockSwitches,
  keycaps: mockKeycaps,
  mcus: mockMCUs,
};

const createDefaultLayout = (): KeyboardLayout => {
  const keys: KeyboardKey[] = [];
  
  const rowLayout = [
    ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Menu', 'Ctrl'],
  ];
  
  const keySizes: Record<string, { width: number; height: number }> = {
    'Backspace': { width: 1.5, height: 1 },
    'Tab': { width: 1.5, height: 1 },
    '\\': { width: 1.5, height: 1 },
    'Caps': { width: 1.75, height: 1 },
    'Enter': { width: 1.75, height: 1 },
    'Shift': { width: 2.25, height: 1 },
    'Ctrl': { width: 1.25, height: 1 },
    'Win': { width: 1.25, height: 1 },
    'Alt': { width: 1.25, height: 1 },
    'Space': { width: 6.25, height: 1 },
    'Menu': { width: 1.25, height: 1 },
  };

  let keyCodeMap: Record<string, string> = {
    'Esc': 'KC_ESC',
    'F1': 'KC_F1', 'F2': 'KC_F2', 'F3': 'KC_F3', 'F4': 'KC_F4',
    'F5': 'KC_F5', 'F6': 'KC_F6', 'F7': 'KC_F7', 'F8': 'KC_F8',
    'F9': 'KC_F9', 'F10': 'KC_F10', 'F11': 'KC_F11', 'F12': 'KC_F12',
    '`': 'KC_GRV', '1': 'KC_1', '2': 'KC_2', '3': 'KC_3', '4': 'KC_4',
    '5': 'KC_5', '6': 'KC_6', '7': 'KC_7', '8': 'KC_8', '9': 'KC_9',
    '0': 'KC_0', '-': 'KC_MINS', '=': 'KC_EQL', 'Backspace': 'KC_BSPC',
    'Tab': 'KC_TAB', 'Q': 'KC_Q', 'W': 'KC_W', 'E': 'KC_E', 'R': 'KC_R',
    'T': 'KC_T', 'Y': 'KC_Y', 'U': 'KC_U', 'I': 'KC_I', 'O': 'KC_O',
    'P': 'KC_P', '[': 'KC_LBRC', ']': 'KC_RBRC', '\\': 'KC_BSLS',
    'Caps': 'KC_CAPS', 'A': 'KC_A', 'S': 'KC_S', 'D': 'KC_D', 'F': 'KC_F',
    'G': 'KC_G', 'H': 'KC_H', 'J': 'KC_J', 'K': 'KC_K', 'L': 'KC_L',
    ';': 'KC_SCLN', "'": 'KC_QUOT', 'Enter': 'KC_ENT',
    'Shift': 'KC_LSFT', 'Z': 'KC_Z', 'X': 'KC_X', 'C': 'KC_C', 'V': 'KC_V',
    'B': 'KC_B', 'N': 'KC_N', 'M': 'KC_M', ',': 'KC_COMM', '.': 'KC_DOT',
    '/': 'KC_SLSH', 'Ctrl': 'KC_LCTL', 'Win': 'KC_LGUI', 'Alt': 'KC_LALT',
    'Space': 'KC_SPC', 'Menu': 'KC_APP',
  };

  const defaultSize = { width: 1, height: 1 };
  const unitSize = 44;
  const spacing = 2;

  for (let rowIdx = 0; rowIdx < rowLayout.length; rowIdx++) {
    let xPos = 0;
    for (let colIdx = 0; colIdx < rowLayout[rowIdx].length; colIdx++) {
      const label = rowLayout[rowIdx][colIdx];
      const size = keySizes[label] || defaultSize;
      
      keys.push({
        id: `key-${rowIdx}-${colIdx}`,
        position: {
          row: rowIdx,
          col: colIdx,
          x: xPos * (unitSize + spacing),
          y: rowIdx * (unitSize + spacing),
        },
        size: {
          width: size.width * unitSize + (size.width - 1) * spacing,
          height: size.height * unitSize + (size.height - 1) * spacing,
        },
        label,
        keycode: keyCodeMap[label] || `KC_${label.toUpperCase()}`,
        style: {
          color: '#3a3a3a',
          textColor: '#ffffff',
          fontFamily: 'Arial',
          fontSize: 12,
          thickness: 4,
          profile: 'Cherry',
        },
        matrixRow: rowIdx,
        matrixCol: colIdx,
      });

      xPos += size.width;
    }
  }

  return {
    id: 'default-60',
    name: 'Default 60% Layout',
    description: 'Standard 60% mechanical keyboard layout',
    keys,
    rowCount: 6,
    colCount: 15,
    keySpacing: spacing,
    unitSize,
  };
};

const defaultFirmwareConfig: FirmwareConfig = {
  mcu: mockMCUs[0],
  matrix: {
    rows: 6,
    cols: 15,
    rowPins: ['D0', 'D1', 'D2', 'D3', 'D4', 'C6'],
    colPins: ['D7', 'E6', 'B4', 'B5', 'B6', 'B2', 'B3', 'B1', 'F7', 'F6', 'F5', 'F4', 'F1', 'F0', 'D5'],
  } as MatrixConfig,
  diodeDirection: 'COL2ROW',
  features: {
    rgb: false,
    oled: false,
    encoder: false,
    audio: false,
  },
  keymapLayers: 2,
};

interface KeyboardStore extends AppState {
  setLayout: (layout: KeyboardLayout) => void;
  updateKey: (keyId: string, updates: Partial<KeyboardKey>) => void;
  addKey: (key: KeyboardKey) => void;
  removeKey: (keyId: string) => void;
  setCurrentKey: (key: KeyboardKey | null) => void;
  setFirmwareConfig: (config: FirmwareConfig) => void;
  setTypingStats: (stats: TypingStats | null) => void;
  toggleDarkMode: () => void;
  resetLayout: () => void;
}

export const useKeyboardStore = create<KeyboardStore>((set) => ({
  layout: createDefaultLayout(),
  firmwareConfig: defaultFirmwareConfig,
  componentLibrary: mockLibrary,
  currentKey: null,
  typingStats: null,
  darkMode: true,

  setLayout: (layout) => set({ layout }),
  
  updateKey: (keyId, updates) =>
    set((state) => {
      if (!state.layout) return state;
      return {
        layout: {
          ...state.layout,
          keys: state.layout.keys.map((k) =>
            k.id === keyId ? { ...k, ...updates } : k
          ),
        },
      };
    }),

  addKey: (key) =>
    set((state) => {
      if (!state.layout) return state;
      return {
        layout: {
          ...state.layout,
          keys: [...state.layout.keys, key],
        },
      };
    }),

  removeKey: (keyId) =>
    set((state) => {
      if (!state.layout) return state;
      return {
        layout: {
          ...state.layout,
          keys: state.layout.keys.filter((k) => k.id !== keyId),
        },
      };
    }),

  setCurrentKey: (key) => set({ currentKey: key }),
  
  setFirmwareConfig: (config) => set({ firmwareConfig: config }),
  
  setTypingStats: (stats) => set({ typingStats: stats }),
  
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  
  resetLayout: () => set({ layout: createDefaultLayout() }),
}));
