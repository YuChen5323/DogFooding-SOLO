export interface Vector2 {
	x: number;
	y: number;
}

export interface Entity {
	id: string;
	position: Vector2;
	velocity: Vector2;
	radius: number;
	health: number;
	maxHealth: number;
	isAlive: boolean;
}

export interface Player extends Entity {
	score: number;
	lives: number;
	bombs: number;
	invulnerable: boolean;
	invulnerableTimer: number;
}

export interface Bullet extends Entity {
	color: string;
	damage: number;
	pattern: 'circle' | 'diamond' | 'triangle' | 'star';
	size: number;
	speed: number;
}

export interface Enemy extends Entity {
	type: 'scout' | 'fighter' | 'cruiser' | 'boss';
	color: string;
	points: number;
	movementPattern: 'straight' | 'zigzag' | 'sine' | 'chase';
	timer: number;
	canShoot: boolean;
	shootTimer: number;
	shootInterval: number;
}

export interface PowerUp extends Entity {
	type: 'health' | 'bomb' | 'rapidFire' | 'shield';
	duration?: number;
}

export interface Particle {
	id: string;
	position: Vector2;
	velocity: Vector2;
	color: string;
	size: number;
	maxSize: number;
	life: number;
	maxLife: number;
	alpha: number;
}

export interface Star {
	x: number;
	y: number;
	size: number;
	speed: number;
	brightness: number;
	color: string;
}

export interface Nebula {
	x: number;
	y: number;
	radius: number;
	color: string;
	alpha: number;
	speed: number;
}

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelSelect' | 'editor' | 'settings';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'insane';

export interface GameSettings {
	volume: number;
	sfxVolume: number;
	musicVolume: number;
	difficulty: Difficulty;
	sensitivity: number;
	screenShake: boolean;
	showFPS: boolean;
	bulletColor: string;
	playerColor: string;
	enemyColor: string;
	visualPreset: VisualPreset;
	showBeatIndicators: boolean;
	autoFire: boolean;
	vibration: boolean;
}

export type VisualPreset = 'cyberpunk' | 'synthwave' | 'matrix' | 'fire' | 'ice' | 'galaxy';

export interface VisualPresetConfig {
	name: string;
	background: string;
	stars: string[];
	nebulae: string[];
	bullets: string[];
	playerShip: string;
	enemies: string[];
	accent: string;
	glow: string;
}

export interface BeatEvent {
	time: number;
	strength: number;
	frequency: 'bass' | 'mid' | 'treble' | 'all';
	triggered: boolean;
}

export interface SpectrumData {
	bass: number;
	mid: number;
	treble: number;
	fullSpectrum: Uint8Array;
	decibels: number;
}

export interface LevelData {
	id: string;
	name: string;
	description: string;
	author: string;
	audioUrl: string;
	audioHash: string;
	duration: number;
	bpm: number;
	beatEvents: BeatEvent[];
	enemySpawns: EnemySpawn[];
	powerUpSpawns: PowerUpSpawn[];
	difficulty: Difficulty;
	isCustom: boolean;
}

export interface EnemySpawn {
	time: number;
	type: Enemy['type'];
	count: number;
	pattern: Enemy['movementPattern'];
	x: number;
	y: number;
}

export interface PowerUpSpawn {
	time: number;
	type: PowerUp['type'];
	x: number;
	y: number;
}

export interface SaveData {
	highScores: { [levelId: string]: number };
	totalScore: number;
	gamesPlayed: number;
	enemiesDefeated: number;
	bulletsFired: number;
	bombsUsed: number;
	unlockedLevels: string[];
	settings: GameSettings;
	lastPlayed: string;
}

export interface EditorState {
	currentTime: number;
	isPlaying: boolean;
	selectedBeat: BeatEvent | null;
	selectedSpawn: EnemySpawn | PowerUpSpawn | null;
	zoom: number;
}
