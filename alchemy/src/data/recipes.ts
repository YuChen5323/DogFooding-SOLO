import type { Recipe, SymbolType } from '../types';

export const RECIPES: Recipe[] = [
  {
    id: 'recipe_healing',
    name: '治疗药剂配方',
    description: '将火元素与土元素结合，产生生命的力量',
    resultItemId: 'potion_healing',
    ingredients: [
      { itemId: 'extract_sulfur_essence', symbol: '☉', quantity: 1, isHidden: false },
      { itemId: 'extract_mint_powder', symbol: '♂', quantity: 1, isHidden: false },
      { itemId: 'fluid_water', symbol: '☽', quantity: 1, isHidden: true },
    ],
    difficulty: 1,
    discovered: true,
    hints: ['太阳象征火元素', '火星象征治疗'],
  },
  {
    id: 'recipe_mana',
    name: '魔力药剂配方',
    description: '水与光的结合，恢复魔法能量',
    resultItemId: 'potion_mana',
    ingredients: [
      { itemId: 'extract_quartz_essence', symbol: '★', quantity: 1, isHidden: false },
      { itemId: 'fluid_water', symbol: '☽', quantity: 1, isHidden: false },
      { itemId: 'extract_mint_powder', symbol: '☿', quantity: 1, isHidden: true },
    ],
    difficulty: 1,
    discovered: true,
    hints: ['星星象征光明的能量', '月亮代表水元素'],
  },
  {
    id: 'recipe_strength',
    name: '力量药剂配方',
    description: '土与火的融合，增强肉体力量',
    resultItemId: 'potion_strength',
    ingredients: [
      { itemId: 'extract_silver_powder', symbol: '♀', quantity: 1, isHidden: false },
      { itemId: 'extract_sulfur_essence', symbol: '☉', quantity: 1, isHidden: false },
      { itemId: 'mineral_iron', symbol: '♄', quantity: 1, isHidden: true },
    ],
    difficulty: 2,
    discovered: false,
    hints: ['金星象征金属', '土星代表坚固'],
  },
  {
    id: 'recipe_invisibility',
    name: '隐身药剂配方',
    description: '暗元素与灵质的结合，使人隐形',
    resultItemId: 'potion_invisibility',
    ingredients: [
      { itemId: 'mineral_obsidian', symbol: '☾', quantity: 1, isHidden: false },
      { itemId: 'fluid_ectoplasm', symbol: '⚗', quantity: 1, isHidden: false },
      { itemId: 'extract_quartz_essence', symbol: '★', quantity: 1, isHidden: true },
    ],
    difficulty: 3,
    discovered: false,
    hints: ['残月代表黑暗', '炼金釜是转化的象征'],
  },
  {
    id: 'recipe_poison',
    name: '剧毒药剂配方',
    description: '毒草与硫磺的致命组合',
    resultItemId: 'potion_poison',
    ingredients: [
      { itemId: 'extract_nightshade_tincture', symbol: '♃', quantity: 1, isHidden: false },
      { itemId: 'extract_sulfur_essence', symbol: '☉', quantity: 1, isHidden: false },
      { itemId: 'fluid_mercury', symbol: '☿', quantity: 1, isHidden: true },
    ],
    difficulty: 2,
    discovered: false,
    hints: ['木星象征扩张与传播', '水星代表流动'],
  },
  {
    id: 'recipe_immortality',
    name: '永生药剂配方',
    description: '传说中能使人永生的终极配方',
    resultItemId: 'potion_immortality',
    ingredients: [
      { itemId: 'fluid_blood', symbol: '☉', quantity: 1, isHidden: false },
      { itemId: 'herb_lotus', symbol: '☽', quantity: 1, isHidden: false },
      { itemId: 'extract_quartz_essence', symbol: '★', quantity: 1, isHidden: true },
      { itemId: 'mineral_obsidian', symbol: '☾', quantity: 1, isHidden: true },
    ],
    difficulty: 5,
    discovered: false,
    hints: ['需要日月星辰的力量', '光明与黑暗的平衡'],
  },
];

export const SYMBOLS: { symbol: SymbolType; name: string; element: string }[] = [
  { symbol: '☉', name: '太阳', element: 'fire' },
  { symbol: '☽', name: '月亮', element: 'water' },
  { symbol: '☿', name: '水星', element: 'water' },
  { symbol: '♀', name: '金星', element: 'earth' },
  { symbol: '♂', name: '火星', element: 'fire' },
  { symbol: '♃', name: '木星', element: 'air' },
  { symbol: '♄', name: '土星', element: 'earth' },
  { symbol: '☾', name: '残月', element: 'dark' },
  { symbol: '★', name: '星辰', element: 'light' },
  { symbol: '⚗', name: '炼金釜', element: 'all' },
];

export function getRecipesByDifficulty(difficulty: number): Recipe[] {
  return RECIPES.filter((r) => r.difficulty === difficulty);
}

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export function getSymbolName(symbol: SymbolType): string {
  const found = SYMBOLS.find((s) => s.symbol === symbol);
  return found ? found.name : symbol;
}
