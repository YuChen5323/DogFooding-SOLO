import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { GameState, User, SaveSlot } from '../types/game';

const defaultGameState: GameState = {
  currentRoom: 'entrance',
  inventory: [],
  flags: {},
  puzzlesSolved: [],
  achievementsUnlocked: [],
  diaryEntries: [],
  playerPosition: { x: 400, y: 450 },
  playTime: 0,
  lastSaved: new Date()
};

export const gameStateAtom = atom<GameState>(defaultGameState);

export const currentRoomAtom = atom(
  (get) => get(gameStateAtom).currentRoom,
  (get, set, newRoom: string) => {
    const state = get(gameStateAtom);
    set(gameStateAtom, { ...state, currentRoom: newRoom });
  }
);

export const inventoryAtom = atom(
  (get) => get(gameStateAtom).inventory,
  (get, set, newInventory: string[]) => {
    const state = get(gameStateAtom);
    set(gameStateAtom, { ...state, inventory: newInventory });
  }
);

export const flagsAtom = atom(
  (get) => get(gameStateAtom).flags,
  (get, set, newFlags: Record<string, boolean>) => {
    const state = get(gameStateAtom);
    set(gameStateAtom, { ...state, flags: newFlags });
  }
);

export const puzzlesSolvedAtom = atom(
  (get) => get(gameStateAtom).puzzlesSolved,
  (get, set, newPuzzles: string[]) => {
    const state = get(gameStateAtom);
    set(gameStateAtom, { ...state, puzzlesSolved: newPuzzles });
  }
);

export const diaryEntriesAtom = atom(
  (get) => get(gameStateAtom).diaryEntries,
  (get, set, update: string[] | ((prev: string[]) => string[])) => {
    const state = get(gameStateAtom);
    const newEntries = typeof update === 'function'
      ? update(state.diaryEntries)
      : update;
    set(gameStateAtom, { ...state, diaryEntries: newEntries });
  }
);

export const playerPositionAtom = atom(
  (get) => get(gameStateAtom).playerPosition,
  (get, set, position: { x: number; y: number }) => {
    const state = get(gameStateAtom);
    set(gameStateAtom, { ...state, playerPosition: position });
  }
);

export const userAtom = atomWithStorage<User | null>('user', null);

export const tokenAtom = atomWithStorage<string | null>('auth_token', null);

export const saveSlotsAtom = atom<SaveSlot[]>([]);

export const currentSaveSlotAtom = atom<number | null>(null);

export const isGamePausedAtom = atom(false);

export const isSettingsOpenAtom = atom(false);

export const isInventoryOpenAtom = atom(false);

export const isDiaryOpenAtom = atom(false);

export const isHintOpenAtom = atom(false);

export const selectedInventoryItemAtom = atom<string | null>(null);

export const currentDialogueAtom = atom<string | null>(null);

export const currentPuzzleAtom = atom<string | null>(null);

export const achievementNotificationAtom = atom<string | null>(null);

export const volumeAtom = atomWithStorage('volume', {
  master: 0.7,
  music: 0.5,
  sfx: 0.8
});

export const isMutedAtom = atomWithStorage('isMuted', false);
