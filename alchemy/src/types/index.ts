export type ItemType = 'herb' | 'mineral' | 'fluid' | 'extract' | 'potion';
export type ExtractType = 'powder' | 'essence' | 'tincture';
export type ElementType = 'fire' | 'water' | 'earth' | 'air' | 'poison' | 'light' | 'dark';
export type SymbolType = '☉' | '☽' | '☿' | '♀' | '♂' | '♃' | '♄' | '☾' | '★' | '⚗';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  icon: string;
  element: ElementType;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  extractType?: ExtractType;
  baseItemId?: string;
}

export interface InventoryItem extends Item {
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  resultItemId: string;
  ingredients: {
    itemId: string;
    symbol: SymbolType;
    quantity: number;
    isHidden: boolean;
  }[];
  difficulty: number;
  discovered: boolean;
  hints: string[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  requiredPotionId: string;
  reward: {
    gold: number;
    reputation: number;
  };
  timeLimit: number;
  isActive: boolean;
  isCompleted: boolean;
}

export interface GameState {
  gold: number;
  reputation: number;
  currentLevel: number;
  experience: number;
  discoveredRecipes: string[];
  completedQuests: string[];
}

export interface ExperimentState {
  currentIngredients: {
    itemId: string;
    slotIndex: number;
    symbol: SymbolType | null;
  }[];
  isBrewing: boolean;
  lastResult: {
    success: boolean;
    explosion: boolean;
    resultItemId: string | null;
    message: string;
  } | null;
}
