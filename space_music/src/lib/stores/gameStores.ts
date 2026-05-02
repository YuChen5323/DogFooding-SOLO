import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type {
	GameState,
	GameSettings,
	VisualPreset,
	Player,
	SpectrumData,
	LevelData,
	SaveData,
	Difficulty
} from '$lib/types/game';
import { DEFAULT_VISUAL_PRESETS } from '$lib/config/visualPresets';

const DEFAULT_SETTINGS: GameSettings = {
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
};

const DEFAULT_PLAYER: Player = {
	id: 'player',
	position: { x: 0, y: 0 },
	velocity: { x: 0, y: 0 },
	radius: 20,
	health: 100,
	maxHealth: 100,
	isAlive: true,
	score: 0,
	lives: 3,
	bombs: 2,
	invulnerable: false,
	invulnerableTimer: 0
};

const DEFAULT_SPECTRUM: SpectrumData = {
	bass: 0,
	mid: 0,
	treble: 0,
	fullSpectrum: new Uint8Array(128),
	decibels: 0
};

const DEFAULT_SAVE_DATA: SaveData = {
	highScores: {},
	totalScore: 0,
	gamesPlayed: 0,
	enemiesDefeated: 0,
	bulletsFired: 0,
	bombsUsed: 0,
	unlockedLevels: [],
	settings: DEFAULT_SETTINGS,
	lastPlayed: new Date().toISOString()
};

function createGameStateStore(): Writable<GameState> {
	const { subscribe, set, update } = writable<GameState>('menu');

	return {
		subscribe,
		set,
		update,
		goToMenu: () => set('menu'),
		startGame: () => set('playing'),
		pauseGame: () => set('paused'),
		resumeGame: () => set('playing'),
		gameOver: () => set('gameover'),
		goToLevelSelect: () => set('levelSelect'),
		goToEditor: () => set('editor'),
		goToSettings: () => set('settings')
	};
}

function createSettingsStore(): Writable<GameSettings> {
	const { subscribe, set, update } = writable<GameSettings>(DEFAULT_SETTINGS);

	return {
		subscribe,
		set,
		update,
		reset: () => set(DEFAULT_SETTINGS),
		setVolume: (volume: number) => update((s) => ({ ...s, volume: Math.max(0, Math.min(1, volume)) })),
		setSfxVolume: (volume: number) => update((s) => ({ ...s, sfxVolume: Math.max(0, Math.min(1, volume)) })),
		setMusicVolume: (volume: number) => update((s) => ({ ...s, musicVolume: Math.max(0, Math.min(1, volume)) })),
		setDifficulty: (difficulty: Difficulty) => update((s) => ({ ...s, difficulty })),
		setSensitivity: (sensitivity: number) => update((s) => ({ ...s, sensitivity: Math.max(0.1, Math.min(3, sensitivity)) })),
		setVisualPreset: (preset: VisualPreset) => update((s) => ({ ...s, visualPreset: preset })),
		toggleScreenShake: () => update((s) => ({ ...s, screenShake: !s.screenShake })),
		toggleShowFPS: () => update((s) => ({ ...s, showFPS: !s.showFPS })),
		toggleBeatIndicators: () => update((s) => ({ ...s, showBeatIndicators: !s.showBeatIndicators })),
		toggleAutoFire: () => update((s) => ({ ...s, autoFire: !s.autoFire })),
		toggleVibration: () => update((s) => ({ ...s, vibration: !s.vibration })),
		setBulletColor: (color: string) => update((s) => ({ ...s, bulletColor: color })),
		setPlayerColor: (color: string) => update((s) => ({ ...s, playerColor: color })),
		setEnemyColor: (color: string) => update((s) => ({ ...s, enemyColor: color }))
	};
}

function createPlayerStore(): Writable<Player> {
	const { subscribe, set, update } = writable<Player>(DEFAULT_PLAYER);

	return {
		subscribe,
		set,
		update,
		reset: (position?: { x: number; y: number }) =>
			set({
				...DEFAULT_PLAYER,
				position: position || { x: 0, y: 0 }
			}),
		takeDamage: (damage: number) =>
			update((p) => {
				if (p.invulnerable) return p;
				const newHealth = p.health - damage;
				if (newHealth <= 0) {
					if (p.lives > 0) {
						return {
							...p,
							health: p.maxHealth,
							lives: p.lives - 1,
							invulnerable: true,
							invulnerableTimer: 120
						};
					} else {
						return { ...p, health: 0, isAlive: false };
					}
				}
				return { ...p, health: newHealth };
			}),
		heal: (amount: number) =>
			update((p) => ({
				...p,
				health: Math.min(p.maxHealth, p.health + amount)
			})),
		addScore: (points: number) =>
			update((p) => ({ ...p, score: p.score + points })),
		addLife: () =>
			update((p) => ({ ...p, lives: Math.min(9, p.lives + 1) })),
		addBomb: () =>
			update((p) => ({ ...p, bombs: Math.min(9, p.bombs + 1) })),
		useBomb: () =>
			update((p) => ({
				...p,
				bombs: Math.max(0, p.bombs - 1)
			})),
		move: (x: number, y: number) =>
			update((p) => ({
				...p,
				position: { x, y }
			})),
		updateInvulnerability: () =>
			update((p) => {
				if (p.invulnerableTimer > 0) {
					const newTimer = p.invulnerableTimer - 1;
					return {
						...p,
						invulnerableTimer: newTimer,
						invulnerable: newTimer > 0
					};
				}
				return p;
			})
	};
}

function createSpectrumStore(): Writable<SpectrumData> {
	const { subscribe, set, update } = writable<SpectrumData>(DEFAULT_SPECTRUM);

	return {
		subscribe,
		set,
		update,
		reset: () => set(DEFAULT_SPECTRUM)
	};
}

function createCurrentLevelStore(): Writable<LevelData | null> {
	const { subscribe, set, update } = writable<LevelData | null>(null);

	return {
		subscribe,
		set,
		update,
		clear: () => set(null)
	};
}

function createPausedStore(): Writable<boolean> {
	const { subscribe, set, update } = writable<boolean>(false);

	return {
		subscribe,
		set,
		update,
		toggle: () => update((p) => !p)
	};
}

function createScreenShakeStore(): Writable<{ x: number; y: number; intensity: number }> {
	const { subscribe, set, update } = writable<{ x: number; y: number; intensity: number }>({ x: 0, y: 0, intensity: 0 });

	return {
		subscribe,
		set,
		update,
		shake: (intensity: number) => {
			const x = (Math.random() - 0.5) * intensity * 2;
			const y = (Math.random() - 0.5) * intensity * 2;
			set({ x, y, intensity });
		},
		reset: () => set({ x: 0, y: 0, intensity: 0 })
	};
}

export const gameState = createGameStateStore();
export const settings = createSettingsStore();
export const player = createPlayerStore();
export const spectrum = createSpectrumStore();
export const currentLevel = createCurrentLevelStore();
export const isPaused = createPausedStore();
export const screenShake = createScreenShakeStore();

export const currentVisualPreset: Readable<{
	name: string;
	background: string;
	stars: string[];
	nebulae: string[];
	bullets: string[];
	playerShip: string;
	enemies: string[];
	accent: string;
	glow: string;
}> = derived(settings, ($settings) => {
	return DEFAULT_VISUAL_PRESETS[$settings.visualPreset];
});

export const effectiveVolume: Readable<{ master: number; sfx: number; music: number }> = derived(settings, ($settings) => {
	return {
		master: $settings.volume,
		sfx: $settings.volume * $settings.sfxVolume,
		music: $settings.volume * $settings.musicVolume
	};
});
