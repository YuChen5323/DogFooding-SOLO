import { LDrawColor } from '../types/ldraw';

/**
 * LDraw 标准颜色定义
 * 基于 LDraw 官方颜色表
 */
export const LDrawColors: Record<number, LDrawColor> = {
  // 主色
  0: { code: 0, name: 'Black', hex: '#05131d' },
  1: { code: 1, name: 'Blue', hex: '#0055bf' },
  2: { code: 2, name: 'Green', hex: '#257a2e' },
  3: { code: 3, name: 'Dark Turquoise', hex: '#008f9b' },
  4: { code: 4, name: 'Red', hex: '#c4281b' },
  5: { code: 5, name: 'Dark Pink', hex: '#c870a0' },
  6: { code: 6, name: 'Brown', hex: '#583927' },
  7: { code: 7, name: 'Light Gray', hex: '#898788' },
  8: { code: 8, name: 'Dark Gray', hex: '#545955' },
  9: { code: 9, name: 'Light Blue', hex: '#5fc9e8' },
  10: { code: 10, name: 'Bright Green', hex: '#42b84b' },
  11: { code: 11, name: 'Light Turquoise', hex: '#35b2c9' },
  12: { code: 12, name: 'Salmon', hex: '#f2705e' },
  13: { code: 13, name: 'Pink', hex: '#fc97ac' },
  14: { code: 14, name: 'Yellow', hex: '#f5cd2f' },
  15: { code: 15, name: 'White', hex: '#ffffff' },
  16: { code: 16, name: 'Main Color', hex: '#ff00ff' }, // 特殊：使用主颜色
  
  // 扩展颜色
  17: { code: 17, name: 'Light Green', hex: '#c2dab0' },
  18: { code: 18, name: 'Light Yellow', hex: '#fae690' },
  19: { code: 19, name: 'Tan', hex: '#d3b17a' },
  20: { code: 20, name: 'Light Violet', hex: '#cd9fdf' },
  21: { code: 21, name: 'Dark Orange', hex: '#a25104' },
  22: { code: 22, name: 'Purple', hex: '#5e2d88' },
  23: { code: 23, name: 'Dark Blue-Violet', hex: '#372d78' },
  24: { code: 24, name: 'Orange', hex: '#f07d13' },
  25: { code: 25, name: 'Magenta', hex: '#923978' },
  26: { code: 26, name: 'Lime', hex: '#bbf65e' },
  27: { code: 27, name: 'Dark Tan', hex: '#958a73' },
  28: { code: 28, name: 'Earth Orange', hex: '#e07a35' },
  29: { code: 29, name: 'Violet', hex: '#845ea6' },
  30: { code: 30, name: 'Medium Blue', hex: '#5a73af' },
  
  // 透明颜色
  31: { code: 31, name: 'Trans-Black', hex: '#05131d', alpha: 204, isTransparent: true },
  32: { code: 32, name: 'Trans-Dark Blue', hex: '#0020a0', alpha: 204, isTransparent: true },
  33: { code: 33, name: 'Trans-Green', hex: '#007d2c', alpha: 204, isTransparent: true },
  34: { code: 34, name: 'Trans-Red', hex: '#9e0b15', alpha: 204, isTransparent: true },
  35: { code: 35, name: 'Trans-Neon Orange', hex: '#ff800d', alpha: 179, isTransparent: true },
  36: { code: 36, name: 'Trans-Yellow', hex: '#fce300', alpha: 204, isTransparent: true },
  37: { code: 37, name: 'Trans-Clear', hex: '#ffffff', alpha: 204, isTransparent: true },
  40: { code: 40, name: 'Trans-Purple', hex: '#682d89', alpha: 204, isTransparent: true },
  41: { code: 41, name: 'Trans-Light Blue', hex: '#71a7c6', alpha: 204, isTransparent: true },
  42: { code: 42, name: 'Trans-Light Green', hex: '#90c14a', alpha: 204, isTransparent: true },
  43: { code: 43, name: 'Trans-Pink', hex: '#e4005a', alpha: 204, isTransparent: true },
  47: { code: 47, name: 'Trans-Medium Blue', hex: '#008aaa', alpha: 204, isTransparent: true },
  
  // 特殊效果颜色
  226: { code: 226, name: 'Pearl Light Gray', hex: '#9ca3a6', isMetallic: true },
  227: { code: 227, name: 'Pearl Dark Gray', hex: '#575857', isMetallic: true },
  228: { code: 228, name: 'Pearl Very Light Gray', hex: '#c9cdca', isMetallic: true },
  229: { code: 229, name: 'Pearl White', hex: '#f2f3f5', isMetallic: true },
  230: { code: 230, name: 'Pearl Yellow', hex: '#f4f4a1', isMetallic: true },
  231: { code: 231, name: 'Pearl Gold', hex: '#deb851', isMetallic: true },
  232: { code: 232, name: 'Copper', hex: '#ae6238', isMetallic: true },
  233: { code: 233, name: 'Pearl Orange', hex: '#d35400', isMetallic: true },
  234: { code: 234, name: 'Reddish Gold', hex: '#e0964b', isMetallic: true },
  235: { code: 235, name: 'Pearl Red', hex: '#cc0022', isMetallic: true },
  236: { code: 236, name: 'Pearl Dark Red', hex: '#880000', isMetallic: true },
  237: { code: 237, name: 'Pearl Violet', hex: '#6b2f5f', isMetallic: true },
  238: { code: 238, name: 'Pearl Blue', hex: '#3a3a82', isMetallic: true },
  239: { code: 239, name: 'Pearl Dark Blue', hex: '#1f1f4a', isMetallic: true },
  240: { code: 240, name: 'Pearl Light Blue', hex: '#6599c6', isMetallic: true },
  241: { code: 241, name: 'Pearl Green', hex: '#4f8352', isMetallic: true },
  242: { code: 242, name: 'Pearl Light Green', hex: '#93b783', isMetallic: true },
  
  // 发光颜色
  243: { code: 243, name: 'Glow In Dark White', hex: '#e9ff9d', isGlow: true },
  244: { code: 244, name: 'Glow In Dark Green', hex: '#90e65d', isGlow: true },
  245: { code: 245, name: 'Glow In Dark Blue', hex: '#6861cc', isGlow: true },
  246: { code: 246, name: 'Glow In Dark Yellow', hex: '#fff580', isGlow: true },
  247: { code: 247, name: 'Glow In Dark Orange', hex: '#ffaa00', isGlow: true },
  248: { code: 248, name: 'Glow In Dark Red', hex: '#ff5555', isGlow: true },
  249: { code: 249, name: 'Glow In Dark Pink', hex: '#ff99cc', isGlow: true },
  250: { code: 250, name: 'Glow In Dark Purple', hex: '#9955ff', isGlow: true },
  
  // 常用颜色别名
  70: { code: 70, name: 'Reddish Brown', hex: '#5c2e0e' },
  71: { code: 71, name: 'Light Bluish Gray', hex: '#9ca1a4' },
  72: { code: 72, name: 'Dark Bluish Gray', hex: '#635f61' },
  73: { code: 73, name: 'Medium Blue', hex: '#5a73af' },
  74: { code: 74, name: 'Dark Green', hex: '#184632' },
  75: { code: 75, name: 'Dark Red', hex: '#720e0f' },
  76: { code: 76, name: 'Dark Purple', hex: '#4a235a' },
  77: { code: 77, name: 'Light Brown', hex: '#c4835b' },
  78: { code: 78, name: 'Dark Orange', hex: '#a25104' },
  79: { code: 79, name: 'Dark Blue', hex: '#0a2d5f' },
};

/**
 * 根据颜色代码获取颜色定义
 * @param code LDraw 颜色代码
 * @param fallbackColor 备用颜色代码 (默认白色 15)
 * @returns LDrawColor 对象
 */
export function getLDrawColor(code: number, fallbackColor: number = 15): LDrawColor {
  return LDrawColors[code] || LDrawColors[fallbackColor] || LDrawColors[15];
}

/**
 * 根据颜色代码获取十六进制颜色值
 * @param code LDraw 颜色代码
 * @param fallbackColor 备用颜色代码
 * @returns 十六进制颜色字符串
 */
export function getLDrawColorHex(code: number, fallbackColor: number = 15): string {
  return getLDrawColor(code, fallbackColor).hex;
}

/**
 * 检查颜色是否为透明色
 * @param code LDraw 颜色代码
 * @returns 是否为透明色
 */
export function isTransparentColor(code: number): boolean {
  const color = LDrawColors[code];
  return color?.isTransparent || false;
}

/**
 * 检查颜色是否为发光色
 * @param code LDraw 颜色代码
 * @returns 是否为发光色
 */
export function isGlowColor(code: number): boolean {
  const color = LDrawColors[code];
  return color?.isGlow || false;
}

/**
 * 检查颜色是否为金属色
 * @param code LDraw 颜色代码
 * @returns 是否为金属色
 */
export function isMetallicColor(code: number): boolean {
  const color = LDrawColors[code];
  return color?.isMetallic || false;
}

/**
 * 获取所有颜色
 * @returns 所有颜色的数组
 */
export function getAllLDrawColors(): LDrawColor[] {
  return Object.values(LDrawColors);
}
