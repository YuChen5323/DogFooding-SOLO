import type { SaveData, GameSettings, LevelData } from '$lib/types/game';

const STORAGE_KEY = 'space_music_save';
const LEVELS_KEY = 'space_music_custom_levels';

const DEFAULT_SAVE_DATA: SaveData = {
	highScores: {},
	totalScore: 0,
	gamesPlayed: 0,
	enemiesDefeated: 0,
	bulletsFired: 0,
	bombsUsed: 0,
	unlockedLevels: [],
	settings: {
		volume: 0.8,
		sfxVolume: 0.7,
		musicVolume: 0.6,
		difficulty: 'normal',
		sensitivity: 1.0,
		screenShake: true,
		showFPS: false,
		bulletColor: '#00ffff',
		playerColor: '#ff00ff',
		enemyColor: '#ff0066',
		visualPreset: 'cyberpunk',
		showBeatIndicators: true,
		autoFire: false,
		vibration: true
	},
	lastPlayed: new Date().toISOString()
};

export function loadSaveData(): SaveData {
	try {
		if (typeof window === 'undefined') return { ...DEFAULT_SAVE_DATA };

		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return {
				...DEFAULT_SAVE_DATA,
				...parsed,
				settings: {
					...DEFAULT_SAVE_DATA.settings,
					...(parsed.settings || {})
				}
			};
		}
		return { ...DEFAULT_SAVE_DATA };
	} catch (error) {
		console.error('Error loading save data:', error);
		return { ...DEFAULT_SAVE_DATA };
	}
}

export function saveSaveData(data: Partial<SaveData>): void {
	try {
		if (typeof window === 'undefined') return;

		const current = loadSaveData();
		const updated: SaveData = {
			...current,
			...data,
			lastPlayed: new Date().toISOString()
		};

		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	} catch (error) {
		console.error('Error saving data:', error);
	}
}

export function updateHighScore(levelId: string, score: number): boolean {
	const current = loadSaveData();
	const currentHigh = current.highScores[levelId] || 0;

	if (score > currentHigh) {
		current.highScores = { ...current.highScores, [levelId]: score };
		saveSaveData({ highScores: current.highScores });
		return true;
	}
	return false;
}

export function getHighScore(levelId: string): number {
	const current = loadSaveData();
	return current.highScores[levelId] || 0;
}

export function updateGameStats(stats: {
	score?: number;
	gamesPlayed?: number;
	enemiesDefeated?: number;
	bulletsFired?: number;
	bombsUsed?: number;
}): void {
	const current = loadSaveData();
	const updated: Partial<SaveData> = {};

	if (stats.score !== undefined) updated.totalScore = current.totalScore + stats.score;
	if (stats.gamesPlayed !== undefined) updated.gamesPlayed = current.gamesPlayed + stats.gamesPlayed;
	if (stats.enemiesDefeated !== undefined)
		updated.enemiesDefeated = current.enemiesDefeated + stats.enemiesDefeated;
	if (stats.bulletsFired !== undefined)
		updated.bulletsFired = current.bulletsFired + stats.bulletsFired;
	if (stats.bombsUsed !== undefined) updated.bombsUsed = current.bombsUsed + stats.bombsUsed;

	saveSaveData(updated);
}

export function loadSettings(): GameSettings {
	return loadSaveData().settings;
}

export function saveSettings(settings: Partial<GameSettings>): void {
	const current = loadSaveData();
	saveSaveData({
		settings: {
			...current.settings,
			...settings
		}
	});
}

export function unlockLevel(levelId: string): void {
	const current = loadSaveData();
	if (!current.unlockedLevels.includes(levelId)) {
		saveSaveData({
			unlockedLevels: [...current.unlockedLevels, levelId]
		});
	}
}

export function isLevelUnlocked(levelId: string): boolean {
	const current = loadSaveData();
	return current.unlockedLevels.includes(levelId) || levelId.startsWith('custom_');
}

export function loadCustomLevels(): LevelData[] {
	try {
		if (typeof window === 'undefined') return [];

		const stored = localStorage.getItem(LEVELS_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
		return [];
	} catch (error) {
		console.error('Error loading custom levels:', error);
		return [];
	}
}

export function saveCustomLevel(level: LevelData): void {
	try {
		if (typeof window === 'undefined') return;

		const levels = loadCustomLevels();
		const existingIndex = levels.findIndex((l) => l.id === level.id);

		if (existingIndex >= 0) {
			levels[existingIndex] = level;
		} else {
			levels.push(level);
		}

		localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
	} catch (error) {
		console.error('Error saving custom level:', error);
	}
}

export function deleteCustomLevel(levelId: string): void {
	try {
		if (typeof window === 'undefined') return;

		const levels = loadCustomLevels();
		const filtered = levels.filter((l) => l.id !== levelId);

		localStorage.setItem(LEVELS_KEY, JSON.stringify(filtered));
	} catch (error) {
		console.error('Error deleting custom level:', error);
	}
}

export function exportLevelData(level: LevelData): string {
	return JSON.stringify(level, null, 2);
}

export function importLevelData(jsonString: string): LevelData | null {
	try {
		const parsed = JSON.parse(jsonString);
		if (isValidLevelData(parsed)) {
			return parsed;
		}
		return null;
	} catch (error) {
		console.error('Error importing level data:', error);
		return null;
	}
}

function isValidLevelData(data: any): data is LevelData {
	return (
		typeof data === 'object' &&
		data !== null &&
		typeof data.id === 'string' &&
		typeof data.name === 'string' &&
		typeof data.duration === 'number' &&
		Array.isArray(data.beatEvents) &&
		Array.isArray(data.enemySpawns)
	);
}

export function clearAllData(): void {
	try {
		if (typeof window === 'undefined') return;
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(LEVELS_KEY);
	} catch (error) {
		console.error('Error clearing data:', error);
	}
}

export function generateLevelId(): string {
	return `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
