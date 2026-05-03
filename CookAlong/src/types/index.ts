export interface Ingredient {
  id: string;
  name: string;
  nameEn?: string;
  quantity: number;
  unit: string;
  density?: number;
  notes?: string;
}

export interface RecipeStepTimer {
  id: string;
  name: string;
  duration: number;
  remainingTime: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  tips?: string[];
  timers: RecipeStepTimer[];
  videoUrl?: string;
  isCompleted: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  ingredients: Ingredient[];
  steps: RecipeStep[];
  matchedIngredients?: string[];
}

export interface DetectedIngredient {
  name: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PersonalNote {
  id: string;
  recipeId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface IngredientAdjustment {
  id: string;
  recipeId: string;
  ingredientId: string;
  originalQuantity: number;
  adjustedQuantity: number;
  notes?: string;
}

export interface TimerMessage {
  type: 'CREATE' | 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'TICK' | 'COMPLETE';
  timerId: string;
  payload?: {
    duration?: number;
    remainingTime?: number;
  };
}

export interface DetectionMessage {
  type: 'INIT' | 'DETECT' | 'RESULT' | 'ERROR';
  payload?: any;
}

export type UnitType = 'cup' | 'tablespoon' | 'teaspoon' | 'gram' | 'kilogram' | 'milliliter' | 'liter' | 'piece' | 'ounce' | 'pound';

export interface DensityEntry {
  name: string;
  nameEn: string;
  density: number;
  aliases: string[];
}

export interface CachedRecipe {
  recipe: Recipe;
  cachedAt: number;
}
