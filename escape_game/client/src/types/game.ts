export interface GameState {
  currentRoom: string;
  inventory: string[];
  flags: Record<string, boolean>;
  puzzlesSolved: string[];
  achievementsUnlocked: string[];
  diaryEntries: string[];
  playerPosition: {
    x: number;
    y: number;
  };
  playTime: number;
  lastSaved: Date;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  combinable?: string[];
  combinedWith?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  background: string;
  exits: Exit[];
  items: string[];
  interactables: Interactable[];
  ambientSound?: string;
}

export interface Exit {
  direction: string;
  targetRoom: string;
  position: { x: number; y: number; width: number; height: number };
  locked?: boolean;
  unlockCondition?: string;
  unlockItem?: string;
}

export interface Interactable {
  id: string;
  name: string;
  type: 'item' | 'puzzle' | 'diary' | 'door';
  position: { x: number; y: number; width: number; height: number };
  flags?: string;
  puzzleId?: string;
  itemId?: string;
  dialogue?: string;
  requiresItem?: string;
}

export interface Puzzle {
  id: string;
  name: string;
  type: 'number_pad' | 'combination_lock' | 'pattern' | 'sequence';
  solution: string | string[];
  hint: string;
  rewardItem?: string;
  unlocksFlag?: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  discovered: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface SaveSlot {
  slotNumber: number;
  gameState?: GameState;
  updatedAt?: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
}
