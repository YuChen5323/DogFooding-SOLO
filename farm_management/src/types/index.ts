export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter'
}

export enum TimeOfDay {
  MORNING = 'morning',
  NOON = 'noon',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night'
}

export interface GameTime {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  season: Season;
  timeOfDay: TimeOfDay;
}

export interface Crop {
  id: string;
  name: string;
  icon: string;
  description: string;
  growthStages: number;
  growthTime: number;
  seasons: Season[];
  buyPrice: number;
  sellPrice: number;
  regrows: boolean;
  regrowTime?: number;
}

export interface PlantedCrop {
  cropId: string;
  currentStage: number;
  growthProgress: number;
  watered: boolean;
  ready: boolean;
  plantedAt: GameTime;
  regrowProgress?: number;
}

export interface Plot {
  x: number;
  y: number;
  tilled: boolean;
  watered: boolean;
  crop: PlantedCrop | null;
  hasRock: boolean;
  hasWeed: boolean;
}

export interface AnimalType {
  id: string;
  name: string;
  icon: string;
  description: string;
  buyPrice: number;
  maxHappiness: number;
  maxHunger: number;
  produceId: string;
  produceTime: number;
  sellPrice: number;
}

export interface Animal {
  id: string;
  type: AnimalType;
  name: string;
  happiness: number;
  hunger: number;
  fedToday: boolean;
  petToday: boolean;
  produceReady: boolean;
  produceProgress: number;
  purchasedAt: GameTime;
}

export interface Barn {
  id: string;
  name: string;
  maxAnimals: number;
  animals: Animal[];
}

export interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  category: 'seed' | 'crop' | 'animal_product' | 'processed' | 'tool' | 'material';
}

export interface Recipe {
  id: string;
  name: string;
  icon: string;
  description: string;
  ingredients: { itemId: string; quantity: number }[];
  resultItemId: string;
  resultQuantity: number;
  sellPrice: number;
}

export interface FestivalEvent {
  id: string;
  name: string;
  description: string;
  season: Season;
  day: number;
  startTime: number;
  endTime: number;
  npcDialogs: { npcId: string; dialog: string }[];
  rewards: { itemId: string; quantity: number }[];
  specialShop: { itemId: string; price: number }[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: GameTime;
  condition: {
    type: 'harvest' | 'sell' | 'days' | 'animals' | 'crops';
    target: number;
    current: number;
  };
}

export interface PlayerStats {
  money: number;
  stamina: number;
  maxStamina: number;
  totalHarvested: number;
  totalSold: number;
  daysPlayed: number;
  animalsOwned: number;
  cropsPlanted: number;
}

export interface GameState {
  time: GameTime;
  stats: PlayerStats;
  inventory: InventoryItem[];
  plots: Plot[][];
  barns: Barn[];
  unlockedRecipes: string[];
  achievements: Achievement[];
  activeFestival: FestivalEvent | null;
  isPaused: boolean;
}

export interface SaveGame {
  id: string;
  playerId: string;
  gameState: GameState;
  createdAt: string;
  updatedAt: string;
}

export interface ShopItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  price: number;
  stock: number;
  maxStock: number;
  category: 'seed' | 'animal' | 'tool' | 'material';
  seasons: Season[];
}
