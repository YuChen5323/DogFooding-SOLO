export interface KeyPosition {
  row: number;
  col: number;
  x: number;
  y: number;
}

export interface KeySize {
  width: number;
  height: number;
}

export interface KeycapStyle {
  color: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  thickness: number;
  profile: 'DSA' | 'SA' | 'Cherry' | 'OEM';
}

export interface Switch {
  id: string;
  name: string;
  type: 'linear' | 'tactile' | 'clicky';
  force: number;
  travel: number;
  color: string;
  brand: string;
  feelScore: number;
}

export interface Keycap {
  id: string;
  name: string;
  material: 'PBT' | 'ABS' | 'PC';
  profile: 'DSA' | 'SA' | 'Cherry' | 'OEM';
  colors: string[];
  legendStyle: 'doubleshot' | 'padprint' | 'laser';
}

export interface KeyboardKey {
  id: string;
  position: KeyPosition;
  size: KeySize;
  label: string;
  keycode: string;
  switch?: Switch;
  keycap?: Keycap;
  style: KeycapStyle;
  matrixRow?: number;
  matrixCol?: number;
}

export interface MatrixConfig {
  rows: number;
  cols: number;
  rowPins: string[];
  colPins: string[];
}

export interface MCU {
  id: string;
  name: string;
  pins: string[];
  firmwareType: 'QMK' | 'VIA' | 'ZMK';
  supported: boolean;
}

export interface FirmwareConfig {
  mcu: MCU;
  matrix: MatrixConfig;
  diodeDirection: 'COL2ROW' | 'ROW2COL';
  features: {
    rgb: boolean;
    oled: boolean;
    encoder: boolean;
    audio: boolean;
  };
  keymapLayers: number;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  errors: number;
  totalChars: number;
  timeElapsed: number;
  fingerHeatmap: Record<string, number>;
}

export interface KeyboardLayout {
  id: string;
  name: string;
  description: string;
  keys: KeyboardKey[];
  rowCount: number;
  colCount: number;
  keySpacing: number;
  unitSize: number;
}

export interface ComponentLibrary {
  switches: Switch[];
  keycaps: Keycap[];
  mcus: MCU[];
}

export interface AppState {
  layout: KeyboardLayout | null;
  firmwareConfig: FirmwareConfig | null;
  componentLibrary: ComponentLibrary;
  currentKey: KeyboardKey | null;
  typingStats: TypingStats | null;
  darkMode: boolean;
}
