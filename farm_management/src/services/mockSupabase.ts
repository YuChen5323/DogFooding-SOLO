import { GameState, SaveGame, Achievement } from '@/types';
import { ACHIEVEMENTS } from '@/data/achievements';

const STORAGE_KEY = 'pixel_farm_savegame';

export class MockSupabaseService {
  private storage: Storage;

  constructor() {
    this.storage = localStorage;
  }

  private generateId(): string {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async getSaveGames(playerId: string): Promise<SaveGame[]> {
    const savedData = this.storage.getItem(STORAGE_KEY);
    if (!savedData) return [];

    try {
      const allSaves: Record<string, SaveGame[]> = JSON.parse(savedData);
      return allSaves[playerId] || [];
    } catch (e) {
      console.error('Failed to parse save games:', e);
      return [];
    }
  }

  async getLatestSave(playerId: string): Promise<SaveGame | null> {
    const saves = await this.getSaveGames(playerId);
    if (saves.length === 0) return null;
    
    saves.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return saves[0];
  }

  async createSave(playerId: string, gameState: GameState): Promise<SaveGame> {
    const now = new Date().toISOString();
    const saveGame: SaveGame = {
      id: this.generateId(),
      playerId,
      gameState,
      createdAt: now,
      updatedAt: now,
    };

    const saves = await this.getSaveGames(playerId);
    saves.push(saveGame);

    await this.saveAllSaves(playerId, saves);
    return saveGame;
  }

  async updateSave(saveId: string, playerId: string, gameState: GameState): Promise<SaveGame> {
    const saves = await this.getSaveGames(playerId);
    const index = saves.findIndex(s => s.id === saveId);

    if (index === -1) {
      throw new Error(`Save game with id ${saveId} not found`);
    }

    saves[index] = {
      ...saves[index],
      gameState,
      updatedAt: new Date().toISOString(),
    };

    await this.saveAllSaves(playerId, saves);
    return saves[index];
  }

  async deleteSave(saveId: string, playerId: string): Promise<void> {
    const saves = await this.getSaveGames(playerId);
    const filtered = saves.filter(s => s.id !== saveId);
    await this.saveAllSaves(playerId, filtered);
  }

  async createOrUpdateSave(playerId: string, gameState: GameState): Promise<SaveGame> {
    const latestSave = await this.getLatestSave(playerId);
    
    if (latestSave) {
      return this.updateSave(latestSave.id, playerId, gameState);
    } else {
      return this.createSave(playerId, gameState);
    }
  }

  private async saveAllSaves(playerId: string, saves: SaveGame[]): Promise<void> {
    const savedData = this.storage.getItem(STORAGE_KEY);
    let allSaves: Record<string, SaveGame[]> = {};

    if (savedData) {
      try {
        allSaves = JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse existing saves:', e);
      }
    }

    allSaves[playerId] = saves;
    this.storage.setItem(STORAGE_KEY, JSON.stringify(allSaves));
  }

  async getAchievements(playerId: string): Promise<Achievement[]> {
    const latestSave = await this.getLatestSave(playerId);
    if (!latestSave) return ACHIEVEMENTS.map(a => ({ ...a }));
    return latestSave.gameState.achievements;
  }

  async unlockAchievement(playerId: string, achievementId: string): Promise<void> {
    const latestSave = await this.getLatestSave(playerId);
    if (!latestSave) return;

    const achievement = latestSave.gameState.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      await this.updateSave(latestSave.id, playerId, latestSave.gameState);
    }
  }

  async autoSave(playerId: string, gameState: GameState): Promise<SaveGame> {
    return this.createOrUpdateSave(playerId, gameState);
  }

  async quickLoad(playerId: string): Promise<GameState | null> {
    const latestSave = await this.getLatestSave(playerId);
    if (!latestSave) return null;
    return latestSave.gameState;
  }

  exportSave(saveGame: SaveGame): string {
    return JSON.stringify(saveGame);
  }

  importSave(data: string, playerId: string): SaveGame | null {
    try {
      const saveGame: SaveGame = JSON.parse(data);
      if (saveGame.playerId !== playerId) {
        saveGame.playerId = playerId;
        saveGame.id = this.generateId();
      }
      return saveGame;
    } catch (e) {
      console.error('Failed to import save:', e);
      return null;
    }
  }

  getSaveInfo(saveGame: SaveGame): {
    date: string;
    day: number;
    season: string;
    money: number;
  } {
    return {
      date: new Date(saveGame.updatedAt).toLocaleString('zh-CN'),
      day: saveGame.gameState.time.day,
      season: saveGame.gameState.time.season,
      money: saveGame.gameState.stats.money,
    };
  }
}

let mockSupabase: MockSupabaseService | null = null;

export const getMockSupabase = (): MockSupabaseService => {
  if (!mockSupabase) {
    mockSupabase = new MockSupabaseService();
  }
  return mockSupabase;
};
