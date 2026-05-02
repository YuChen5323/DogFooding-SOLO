import type {
	Player,
	Enemy,
	Bullet,
	Particle,
	Star,
	Nebula,
	BeatEvent,
	SpectrumData,
	Vector2,
	EnemySpawn,
	PowerUp,
	PowerUpSpawn,
	Difficulty
} from '$lib/types/game';
import { AudioAnalyzer } from '$lib/audio/AudioAnalyzer';
import { DEFAULT_VISUAL_PRESETS } from '$lib/config/visualPresets';
import type { VisualPreset } from '$lib/types/game';

export class GameEngine {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private width: number = 0;
	private height: number = 0;
	private animationFrameId: number = 0;
	private lastTime: number = 0;
	private deltaTime: number = 0;

	private isRunning: boolean = false;
	private isPaused: boolean = false;

	private player: Player;
	private enemies: Enemy[] = [];
	private playerBullets: Bullet[] = [];
	private enemyBullets: Bullet[] = [];
	private particles: Particle[] = [];
	private powerUps: PowerUp[] = [];
	private stars: Star[] = [];
	private nebulae: Nebula[] = [];

	private audioAnalyzer: AudioAnalyzer;
	private spectrumData: SpectrumData | null = null;
	private beatEvents: BeatEvent[] = [];
	private enemySpawns: EnemySpawn[] = [];
	private powerUpSpawns: PowerUpSpawn[] = [];

	private visualPreset: VisualPreset = 'cyberpunk';
	private difficulty: Difficulty = 'normal';

	private shakeX: number = 0;
	private shakeY: number = 0;
	private shakeIntensity: number = 0;

	private rapidFireActive: boolean = false;
	private rapidFireTimer: number = 0;
	private shieldActive: boolean = false;
	private shieldTimer: number = 0;

	private lastProcessedSpawnIndex: number = -1;
	private lastProcessedPowerUpIndex: number = -1;

	private touchControls: {
		joystickActive: boolean;
		joystickStart: Vector2 | null;
		joystickCurrent: Vector2 | null;
		firePressed: boolean;
		bombPressed: boolean;
	} = {
		joystickActive: false,
		joystickStart: null,
		joystickCurrent: null,
		firePressed: false,
		bombPressed: false
	};

	private keyboardState: { [key: string]: boolean } = {};
	private mousePosition: Vector2 = { x: 0, y: 0 };
	private mouseDown: boolean = false;

	private onGameOver: ((score: number) => void) | null = null;
	private onScoreUpdate: ((score: number) => void) | null = null;
	private onHealthUpdate: ((health: number, maxHealth: number) => void) | null = null;
	private onLivesUpdate: ((lives: number) => void) | null = null;
	private onBombsUpdate: ((bombs: number) => void) | null = null;
	private onSpectrumUpdate: ((data: SpectrumData) => void) | null = null;
	private onBeat: ((event: BeatEvent) => void) | null = null;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Could not get canvas context');
		this.ctx = ctx;

		this.audioAnalyzer = new AudioAnalyzer();
		this.audioAnalyzer.setOnBeatCallback(this.handleBeat.bind(this));
		this.audioAnalyzer.setOnSpectrumCallback(this.handleSpectrum.bind(this));

		this.player = this.createDefaultPlayer();

		this.setupInputHandlers();
		this.resize();
	}

	private createDefaultPlayer(): Player {
		return {
			id: 'player',
			position: { x: this.width / 2, y: this.height - 100 },
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
	}

	private getPresetColors() {
		return DEFAULT_VISUAL_PRESETS[this.visualPreset];
	}

	private setupInputHandlers(): void {
		window.addEventListener('keydown', (e) => {
			this.keyboardState[e.code] = true;
			if (e.code === 'Escape') {
				this.togglePause();
			}
			if (e.code === 'Space') {
				e.preventDefault();
			}
		});

		window.addEventListener('keyup', (e) => {
			this.keyboardState[e.code] = false;
		});

		this.canvas.addEventListener('mousemove', (e) => {
			const rect = this.canvas.getBoundingClientRect();
			this.mousePosition = {
				x: (e.clientX - rect.left) * (this.width / rect.width),
				y: (e.clientY - rect.top) * (this.height / rect.height)
			};
		});

		this.canvas.addEventListener('mousedown', () => {
			this.mouseDown = true;
		});

		this.canvas.addEventListener('mouseup', () => {
			this.mouseDown = false;
		});

		this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
		this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
		this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

		window.addEventListener('resize', () => this.resize());
	}

	private handleTouchStart(e: TouchEvent): void {
		e.preventDefault();
		const touches = e.touches;
		const rect = this.canvas.getBoundingClientRect();

		for (let i = 0; i < touches.length; i++) {
			const touch = touches[i];
			const x = (touch.clientX - rect.left) * (this.width / rect.width);
			const y = (touch.clientY - rect.top) * (this.height / rect.height);

			if (x < this.width / 2) {
				this.touchControls.joystickActive = true;
				this.touchControls.joystickStart = { x, y };
				this.touchControls.joystickCurrent = { x, y };
			} else if (x < this.width * 0.75) {
				this.touchControls.firePressed = true;
			} else {
				this.touchControls.bombPressed = true;
			}
		}
	}

	private handleTouchMove(e: TouchEvent): void {
		e.preventDefault();
		const touches = e.touches;
		const rect = this.canvas.getBoundingClientRect();

		for (let i = 0; i < touches.length; i++) {
			const touch = touches[i];
			const x = (touch.clientX - rect.left) * (this.width / rect.width);
			const y = (touch.clientY - rect.top) * (this.height / rect.height);

			if (this.touchControls.joystickActive && this.touchControls.joystickStart) {
				if (x < this.width / 2) {
					this.touchControls.joystickCurrent = { x, y };
				}
			}
		}
	}

	private handleTouchEnd(e: TouchEvent): void {
		e.preventDefault();
		const touches = e.changedTouches;
		const rect = this.canvas.getBoundingClientRect();

		for (let i = 0; i < touches.length; i++) {
			const touch = touches[i];
			const x = (touch.clientX - rect.left) * (this.width / rect.width);

			if (x < this.width / 2) {
				this.touchControls.joystickActive = false;
				this.touchControls.joystickStart = null;
				this.touchControls.joystickCurrent = null;
			} else if (x < this.width * 0.75) {
				this.touchControls.firePressed = false;
			} else {
				this.touchControls.bombPressed = false;
			}
		}
	}

	resize(): void {
		const dpr = window.devicePixelRatio || 1;
		const rect = this.canvas.getBoundingClientRect();

		this.width = rect.width * dpr;
		this.height = rect.height * dpr;

		this.canvas.width = this.width;
		this.canvas.height = this.height;

		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		this.initBackground();

		if (this.player) {
			this.player.position.y = this.height / dpr - 100;
			this.player.position.x = Math.min(
				Math.max(this.player.position.x, this.player.radius),
				this.width / dpr - this.player.radius
			);
		}
	}

	private initBackground(): void {
		const colors = this.getPresetColors();

		this.stars = [];
		for (let i = 0; i < 150; i++) {
			this.stars.push({
				x: Math.random() * this.width,
				y: Math.random() * this.height,
				size: Math.random() * 3 + 1,
				speed: Math.random() * 2 + 0.5,
				brightness: Math.random(),
				color: colors.stars[Math.floor(Math.random() * colors.stars.length)]
			});
		}

		this.nebulae = [];
		for (let i = 0; i < 5; i++) {
			this.nebulae.push({
				x: Math.random() * this.width,
				y: Math.random() * this.height,
				radius: Math.random() * 200 + 100,
				color: colors.nebulae[Math.floor(Math.random() * colors.nebulae.length)],
				alpha: Math.random() * 0.3 + 0.1,
				speed: Math.random() * 0.5 + 0.2
			});
		}
	}

	setVisualPreset(preset: VisualPreset): void {
		this.visualPreset = preset;
		this.initBackground();
	}

	setDifficulty(difficulty: Difficulty): void {
		this.difficulty = difficulty;
	}

	setBeatEvents(events: BeatEvent[]): void {
		this.beatEvents = [...events].sort((a, b) => a.time - b.time);
		this.audioAnalyzer.setBeatEvents(events);
	}

	setEnemySpawns(spawns: EnemySpawn[]): void {
		this.enemySpawns = [...spawns].sort((a, b) => a.time - b.time);
		this.lastProcessedSpawnIndex = -1;
	}

	setPowerUpSpawns(spawns: PowerUpSpawn[]): void {
		this.powerUpSpawns = [...spawns].sort((a, b) => a.time - b.time);
		this.lastProcessedPowerUpIndex = -1;
	}

	setOnGameOver(callback: (score: number) => void): void {
		this.onGameOver = callback;
	}

	setOnScoreUpdate(callback: (score: number) => void): void {
		this.onScoreUpdate = callback;
	}

	setOnHealthUpdate(callback: (health: number, maxHealth: number) => void): void {
		this.onHealthUpdate = callback;
	}

	setOnLivesUpdate(callback: (lives: number) => void): void {
		this.onLivesUpdate = callback;
	}

	setOnBombsUpdate(callback: (bombs: number) => void): void {
		this.onBombsUpdate = callback;
	}

	setOnSpectrumUpdate(callback: (data: SpectrumData) => void): void {
		this.onSpectrumUpdate = callback;
	}

	setOnBeat(callback: (event: BeatEvent) => void): void {
		this.onBeat = callback;
	}

	getAudioAnalyzer(): AudioAnalyzer {
		return this.audioAnalyzer;
	}

	getPlayer(): Player {
		return { ...this.player };
	}

	getScore(): number {
		return this.player.score;
	}

	getIsRunning(): boolean {
		return this.isRunning;
	}

	getIsPaused(): boolean {
		return this.isPaused;
	}

	start(): void {
		if (this.isRunning) return;

		this.resetGame();
		this.isRunning = true;
		this.isPaused = false;
		this.lastTime = performance.now();
		this.audioAnalyzer.play();
		this.gameLoop();
	}

	stop(): void {
		this.isRunning = false;
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
		}
		this.audioAnalyzer.pause();
	}

	togglePause(): void {
		if (!this.isRunning) return;

		this.isPaused = !this.isPaused;

		if (this.isPaused) {
			this.audioAnalyzer.pause();
		} else {
			this.lastTime = performance.now();
			this.audioAnalyzer.play();
			this.gameLoop();
		}
	}

	private resetGame(): void {
		const dpr = window.devicePixelRatio || 1;

		this.player = this.createDefaultPlayer();
		this.player.position.x = this.width / dpr / 2;
		this.player.position.y = this.height / dpr - 100;

		this.enemies = [];
		this.playerBullets = [];
		this.enemyBullets = [];
		this.particles = [];
		this.powerUps = [];

		this.lastProcessedSpawnIndex = -1;
		this.lastProcessedPowerUpIndex = -1;

		this.rapidFireActive = false;
		this.rapidFireTimer = 0;
		this.shieldActive = false;
		this.shieldTimer = 0;

		this.shakeX = 0;
		this.shakeY = 0;
		this.shakeIntensity = 0;

		this.notifyCallbacks();
	}

	private handleBeat(event: BeatEvent): void {
		if (this.isPaused) return;

		if (this.onBeat) {
			this.onBeat(event);
		}

		if (event.frequency === 'bass' || event.frequency === 'all') {
			this.shakeScreen(5 + event.strength * 10);
			this.firePlayerBulletBurst(Math.floor(event.strength * 8) + 3);
			this.spawnEnemiesOnBeat(event);
		}

		if (event.frequency === 'mid' || event.frequency === 'all') {
			this.firePlayerBulletBurst(Math.floor(event.strength * 5) + 2);
		}

		if (event.frequency === 'treble' || event.frequency === 'all') {
			this.firePlayerBulletBurst(Math.floor(event.strength * 3) + 1);
		}
	}

	private handleSpectrum(data: SpectrumData): void {
		this.spectrumData = data;

		if (this.onSpectrumUpdate) {
			this.onSpectrumUpdate(data);
		}

		if (this.spectrumData && this.spectrumData.bass > 0.7) {
			this.shakeScreen(this.spectrumData.bass * 3);
		}
	}

	private spawnEnemiesOnBeat(event: BeatEvent): void {
		const colors = this.getPresetColors();

		if (Math.random() < 0.6) {
			const types: Enemy['type'][] = ['scout', 'fighter', 'cruiser'];
			const patterns: Enemy['movementPattern'][] = ['straight', 'zigzag', 'sine'];

			const type = types[Math.floor(Math.random() * types.length)];
			const pattern = patterns[Math.floor(Math.random() * patterns.length)];

			this.spawnEnemy(type, pattern, -1, -1);
		}
	}

	private spawnEnemy(
		type: Enemy['type'],
		pattern: Enemy['movementPattern'],
		x: number = -1,
		y: number = -1
	): void {
		const colors = this.getPresetColors();
		const dpr = window.devicePixelRatio || 1;
		const canvasWidth = this.width / dpr;

		const actualX = x >= 0 ? x : Math.random() * (canvasWidth - 100) + 50;
		const actualY = y >= 0 ? y : -50;

		const enemyConfig: Record<
			Enemy['type'],
			{ radius: number; health: number; points: number; canShoot: boolean; shootInterval: number }
		> = {
			scout: { radius: 15, health: 20, points: 100, canShoot: false, shootInterval: 180 },
			fighter: { radius: 25, health: 50, points: 200, canShoot: true, shootInterval: 120 },
			cruiser: { radius: 40, health: 100, points: 500, canShoot: true, shootInterval: 90 },
			boss: { radius: 80, health: 500, points: 2000, canShoot: true, shootInterval: 60 }
		};

		const config = enemyConfig[type];
		const difficultyMultiplier = this.getDifficultyMultiplier();

		this.enemies.push({
			id: `enemy_${Date.now()}_${Math.random()}`,
			position: { x: actualX, y: actualY },
			velocity: { x: 0, y: 2 + Math.random() },
			radius: config.radius,
			health: Math.floor(config.health * difficultyMultiplier.health),
			maxHealth: Math.floor(config.health * difficultyMultiplier.health),
			isAlive: true,
			type: type,
			color: colors.enemies[Math.floor(Math.random() * colors.enemies.length)],
			points: Math.floor(config.points * difficultyMultiplier.score),
			movementPattern: pattern,
			timer: 0,
			canShoot: config.canShoot,
			shootTimer: 0,
			shootInterval: Math.floor(config.shootInterval / difficultyMultiplier.speed)
		});
	}

	private spawnPowerUp(type: PowerUp['type'], x: number, y: number): void {
		const colors = this.getPresetColors();

		this.powerUps.push({
			id: `powerup_${Date.now()}_${Math.random()}`,
			position: { x, y },
			velocity: { x: 0, y: 1.5 },
			radius: 15,
			health: 1,
			maxHealth: 1,
			isAlive: true,
			type: type,
			duration: type === 'rapidFire' || type === 'shield' ? 300 : undefined
		});
	}

	private getDifficultyMultiplier(): {
		health: number;
		speed: number;
		score: number;
		damage: number;
	} {
		switch (this.difficulty) {
			case 'easy':
				return { health: 0.7, speed: 0.8, score: 0.7, damage: 0.5 };
			case 'normal':
				return { health: 1, speed: 1, score: 1, damage: 1 };
			case 'hard':
				return { health: 1.5, speed: 1.3, score: 1.5, damage: 1.5 };
			case 'insane':
				return { health: 2, speed: 1.6, score: 2, damage: 2 };
			default:
				return { health: 1, speed: 1, score: 1, damage: 1 };
		}
	}

	private firePlayerBulletBurst(count: number): void {
		const colors = this.getPresetColors();
		const patterns: Bullet['pattern'][] = ['circle', 'diamond', 'triangle', 'star'];

		for (let i = 0; i < count; i++) {
			const angleSpread = (Math.PI / 4) * (i / (count - 1 || 1) - 0.5);
			const baseAngle = -Math.PI / 2;
			const angle = baseAngle + angleSpread * 0.5;

			this.playerBullets.push({
				id: `bullet_${Date.now()}_${Math.random()}_${i}`,
				position: { ...this.player.position },
				velocity: {
					x: Math.cos(angle) * (10 + Math.random() * 2),
					y: Math.sin(angle) * (10 + Math.random() * 2)
				},
				radius: 5,
				health: 1,
				maxHealth: 1,
				isAlive: true,
				color: colors.bullets[Math.floor(Math.random() * colors.bullets.length)],
				damage: 10,
				pattern: patterns[Math.floor(Math.random() * patterns.length)],
				size: 8,
				speed: 10
			});
		}
	}

	private fireEnemyBullet(enemy: Enemy): void {
		const dx = this.player.position.x - enemy.position.x;
		const dy = this.player.position.y - enemy.position.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist > 0) {
			const colors = this.getPresetColors();
			const angle = Math.atan2(dy, dx);

			this.enemyBullets.push({
				id: `enemy_bullet_${Date.now()}_${Math.random()}`,
				position: { ...enemy.position },
				velocity: {
					x: Math.cos(angle) * 5,
					y: Math.sin(angle) * 5
				},
				radius: 6,
				health: 1,
				maxHealth: 1,
				isAlive: true,
				color: colors.enemies[0],
				damage: 20,
				pattern: 'circle',
				size: 10,
				speed: 5
			});
		}
	}

	private useBomb(): void {
		if (this.player.bombs <= 0 || this.isPaused) return;

		this.player.bombs--;

		this.createExplosion(this.player.position.x, this.player.position.y, 100);
		this.shakeScreen(20);

		this.enemies.forEach((enemy) => {
			enemy.health -= 100;
			if (enemy.health <= 0 && enemy.isAlive) {
				enemy.isAlive = false;
				this.player.score += enemy.points;
				this.createExplosion(enemy.position.x, enemy.position.y, 30);
			}
		});

		this.enemyBullets = [];

		this.notifyCallbacks();
	}

	private createExplosion(x: number, y: number, particleCount: number): void {
		const colors = this.getPresetColors();

		for (let i = 0; i < particleCount; i++) {
			const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
			const speed = Math.random() * 8 + 2;

			this.particles.push({
				id: `particle_${Date.now()}_${Math.random()}_${i}`,
				position: { x, y },
				velocity: {
					x: Math.cos(angle) * speed,
					y: Math.sin(angle) * speed
				},
				color: colors.accent,
				size: Math.random() * 8 + 2,
				maxSize: 12,
				life: 1,
				maxLife: 1,
				alpha: 1
			});
		}
	}

	private shakeScreen(intensity: number): void {
		this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
	}

	private gameLoop(): void {
		if (!this.isRunning || this.isPaused) return;

		const currentTime = performance.now();
		this.deltaTime = (currentTime - this.lastTime) / 16.67;
		this.lastTime = currentTime;

		this.update();
		this.render();

		this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
	}

	private update(): void {
		this.updateInput();
		this.updateBackground();
		this.updatePlayer();
		this.updateBullets();
		this.updateEnemies();
		this.updatePowerUps();
		this.updateParticles();
		this.checkCollisions();
		this.updateScreenShake();
		this.checkTimedSpawns();
		this.updatePowerUpTimers();
	}

	private updateInput(): void {
		const dpr = window.devicePixelRatio || 1;
		const canvasWidth = this.width / dpr;
		const canvasHeight = this.height / dpr;
		const sensitivity = 6 * (this.deltaTime || 1);

		if (this.touchControls.joystickActive && this.touchControls.joystickStart && this.touchControls.joystickCurrent) {
			const dx = this.touchControls.joystickCurrent.x - this.touchControls.joystickStart.x;
			const dy = this.touchControls.joystickCurrent.y - this.touchControls.joystickStart.y;
			const maxDist = 50;
			const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
			const angle = Math.atan2(dy, dx);

			this.player.position.x += Math.cos(angle) * (dist / maxDist) * sensitivity;
			this.player.position.y += Math.sin(angle) * (dist / maxDist) * sensitivity;
		} else {
			if (this.keyboardState['ArrowLeft'] || this.keyboardState['KeyA']) {
				this.player.position.x -= sensitivity;
			}
			if (this.keyboardState['ArrowRight'] || this.keyboardState['KeyD']) {
				this.player.position.x += sensitivity;
			}
			if (this.keyboardState['ArrowUp'] || this.keyboardState['KeyW']) {
				this.player.position.y -= sensitivity;
			}
			if (this.keyboardState['ArrowDown'] || this.keyboardState['KeyS']) {
				this.player.position.y += sensitivity;
			}
		}

		this.player.position.x = Math.max(this.player.radius, Math.min(canvasWidth - this.player.radius, this.player.position.x));
		this.player.position.y = Math.max(this.player.radius, Math.min(canvasHeight - this.player.radius, this.player.position.y));

		if (this.keyboardState['Space'] || this.touchControls.firePressed || this.mouseDown) {
			if (this.rapidFireActive) {
				if (Math.random() < 0.3) {
					this.firePlayerBulletBurst(1);
				}
			}
		}

		if (this.keyboardState['KeyB'] || this.touchControls.bombPressed) {
			if (!this.bombPressedLastFrame) {
				this.useBomb();
			}
			this.bombPressedLastFrame = true;
		} else {
			this.bombPressedLastFrame = false;
		}
	}

	private bombPressedLastFrame: boolean = false;

	private updateBackground(): void {
		const dpr = window.devicePixelRatio || 1;
		const canvasHeight = this.height / dpr;

		this.stars.forEach((star) => {
			star.y += star.speed * this.deltaTime;
			if (star.y > canvasHeight) {
				star.y = -10;
				star.x = Math.random() * this.width;
			}
		});

		this.nebulae.forEach((nebula) => {
			nebula.y += nebula.speed * this.deltaTime;
			if (nebula.y > canvasHeight + nebula.radius) {
				nebula.y = -nebula.radius;
				nebula.x = Math.random() * this.width;
			}
		});
	}

	private updatePlayer(): void {
		if (this.player.invulnerableTimer > 0) {
			this.player.invulnerableTimer--;
			this.player.invulnerable = this.player.invulnerableTimer > 0;
		}
	}

	private updateBullets(): void {
		const dpr = window.devicePixelRatio || 1;
		const canvasWidth = this.width / dpr;
		const canvasHeight = this.height / dpr;

		this.playerBullets = this.playerBullets.filter((bullet) => {
			bullet.position.x += bullet.velocity.x * this.deltaTime;
			bullet.position.y += bullet.velocity.y * this.deltaTime;
			return (
				bullet.isAlive &&
				bullet.position.x > -50 &&
				bullet.position.x < canvasWidth + 50 &&
				bullet.position.y > -50 &&
				bullet.position.y < canvasHeight + 50
			);
		});

		this.enemyBullets = this.enemyBullets.filter((bullet) => {
			bullet.position.x += bullet.velocity.x * this.deltaTime;
			bullet.position.y += bullet.velocity.y * this.deltaTime;
			return (
				bullet.isAlive &&
				bullet.position.x > -50 &&
				bullet.position.x < canvasWidth + 50 &&
				bullet.position.y > -50 &&
				bullet.position.y < canvasHeight + 50
			);
		});
	}

	private updateEnemies(): void {
		const dpr = window.devicePixelRatio || 1;
		const canvasWidth = this.width / dpr;
		const canvasHeight = this.height / dpr;

		this.enemies = this.enemies.filter((enemy) => {
			if (!enemy.isAlive) return false;

			enemy.timer += this.deltaTime;

			switch (enemy.movementPattern) {
				case 'straight':
					enemy.position.y += enemy.velocity.y * this.deltaTime;
					break;
				case 'zigzag':
					enemy.position.y += enemy.velocity.y * this.deltaTime;
					enemy.position.x += Math.sin(enemy.timer * 0.1) * 3 * this.deltaTime;
					break;
				case 'sine':
					enemy.position.y += enemy.velocity.y * this.deltaTime;
					enemy.position.x = canvasWidth / 2 + Math.sin(enemy.timer * 0.05) * (canvasWidth / 3);
					break;
				case 'chase':
					enemy.position.y += enemy.velocity.y * this.deltaTime * 0.5;
					const dx = this.player.position.x - enemy.position.x;
					enemy.position.x += (dx > 0 ? 1 : -1) * 1.5 * this.deltaTime;
					break;
			}

			enemy.position.x = Math.max(enemy.radius, Math.min(canvasWidth - enemy.radius, enemy.position.x));

			if (enemy.canShoot && enemy.position.y > 0 && enemy.position.y < canvasHeight / 2) {
				enemy.shootTimer -= this.deltaTime;
				if (enemy.shootTimer <= 0) {
					this.fireEnemyBullet(enemy);
					enemy.shootTimer = enemy.shootInterval;
				}
			}

			return enemy.position.y < canvasHeight + 100;
		});
	}

	private updatePowerUps(): void {
		const dpr = window.devicePixelRatio || 1;
		const canvasHeight = this.height / dpr;

		this.powerUps = this.powerUps.filter((powerUp) => {
			if (!powerUp.isAlive) return false;

			powerUp.position.y += powerUp.velocity.y * this.deltaTime;
			return powerUp.position.y < canvasHeight + 50;
		});
	}

	private updateParticles(): void {
		this.particles = this.particles.filter((particle) => {
			particle.position.x += particle.velocity.x * this.deltaTime;
			particle.position.y += particle.velocity.y * this.deltaTime;
			particle.life -= 0.02 * this.deltaTime;
			particle.alpha = particle.life / particle.maxLife;
			particle.size = particle.maxSize * particle.alpha;

			return particle.life > 0;
		});
	}

	private checkCollisions(): void {
		const difficultyMultiplier = this.getDifficultyMultiplier();

		this.playerBullets.forEach((bullet) => {
			this.enemies.forEach((enemy) => {
				if (this.checkCircleCollision(bullet, enemy)) {
					bullet.isAlive = false;
					enemy.health -= bullet.damage;

					if (enemy.health <= 0 && enemy.isAlive) {
						enemy.isAlive = false;
						this.player.score += enemy.points;
						this.createExplosion(enemy.position.x, enemy.position.y, 20);
						this.shakeScreen(3);

						if (Math.random() < 0.2) {
							const powerUpTypes: PowerUp['type'][] = ['health', 'bomb', 'rapidFire', 'shield'];
							const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
							this.spawnPowerUp(type, enemy.position.x, enemy.position.y);
						}

						this.notifyCallbacks();
					}
				}
			});
		});

		if (!this.player.invulnerable) {
			this.enemyBullets.forEach((bullet) => {
				if (this.checkCircleCollision(bullet, this.player)) {
					bullet.isAlive = false;

					if (!this.shieldActive) {
						const damage = Math.floor(bullet.damage * difficultyMultiplier.damage);
						this.player.health -= damage;
						this.createExplosion(this.player.position.x, this.player.position.y, 10);
						this.shakeScreen(5);

						if (this.player.health <= 0) {
							this.handlePlayerDeath();
						}

						this.notifyCallbacks();
					}
				}
			});

			this.enemies.forEach((enemy) => {
				if (this.checkCircleCollision(enemy, this.player)) {
					if (!this.shieldActive) {
						this.handlePlayerDeath();
					}
					enemy.isAlive = false;
					this.createExplosion(enemy.position.x, enemy.position.y, 20);
				}
			});
		}

		this.powerUps.forEach((powerUp) => {
			if (this.checkCircleCollision(powerUp, this.player)) {
				powerUp.isAlive = false;
				this.activatePowerUp(powerUp);
			}
		});
	}

	private checkCircleCollision(a: { position: Vector2; radius: number }, b: { position: Vector2; radius: number }): boolean {
		const dx = a.position.x - b.position.x;
		const dy = a.position.y - b.position.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		return distance < a.radius + b.radius;
	}

	private handlePlayerDeath(): void {
		this.createExplosion(this.player.position.x, this.player.position.y, 50);
		this.shakeScreen(10);

		if (this.player.lives > 0) {
			this.player.lives--;
			this.player.health = this.player.maxHealth;
			this.player.invulnerable = true;
			this.player.invulnerableTimer = 180;

			const dpr = window.devicePixelRatio || 1;
			this.player.position.x = this.width / dpr / 2;
			this.player.position.y = this.height / dpr - 100;

			this.notifyCallbacks();
		} else {
			this.player.isAlive = false;
			this.isRunning = false;

			if (this.onGameOver) {
				this.onGameOver(this.player.score);
			}
		}
	}

	private activatePowerUp(powerUp: PowerUp): void {
		switch (powerUp.type) {
			case 'health':
				this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
				this.notifyCallbacks();
				break;
			case 'bomb':
				this.player.bombs = Math.min(9, this.player.bombs + 1);
				this.notifyCallbacks();
				break;
			case 'rapidFire':
				this.rapidFireActive = true;
				this.rapidFireTimer = powerUp.duration || 300;
				break;
			case 'shield':
				this.shieldActive = true;
				this.shieldTimer = powerUp.duration || 300;
				break;
		}
	}

	private updatePowerUpTimers(): void {
		if (this.rapidFireTimer > 0) {
			this.rapidFireTimer--;
			if (this.rapidFireTimer <= 0) {
				this.rapidFireActive = false;
			}
		}

		if (this.shieldTimer > 0) {
			this.shieldTimer--;
			if (this.shieldTimer <= 0) {
				this.shieldActive = false;
			}
		}
	}

	private updateScreenShake(): void {
		if (this.shakeIntensity > 0) {
			this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
			this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
			this.shakeIntensity *= 0.95;

			if (this.shakeIntensity < 0.1) {
				this.shakeIntensity = 0;
				this.shakeX = 0;
				this.shakeY = 0;
			}
		}
	}

	private checkTimedSpawns(): void {
		const currentTime = this.audioAnalyzer.getCurrentTime();

		for (let i = this.lastProcessedSpawnIndex + 1; i < this.enemySpawns.length; i++) {
			const spawn = this.enemySpawns[i];
			if (spawn.time <= currentTime) {
				for (let j = 0; j < spawn.count; j++) {
					const offsetX = (j - (spawn.count - 1) / 2) * 60;
					this.spawnEnemy(spawn.type, spawn.pattern, spawn.x + offsetX, spawn.y);
				}
				this.lastProcessedSpawnIndex = i;
			} else {
				break;
			}
		}

		for (let i = this.lastProcessedPowerUpIndex + 1; i < this.powerUpSpawns.length; i++) {
			const spawn = this.powerUpSpawns[i];
			if (spawn.time <= currentTime) {
				this.spawnPowerUp(spawn.type, spawn.x, spawn.y);
				this.lastProcessedPowerUpIndex = i;
			} else {
				break;
			}
		}
	}

	private notifyCallbacks(): void {
		if (this.onScoreUpdate) {
			this.onScoreUpdate(this.player.score);
		}
		if (this.onHealthUpdate) {
			this.onHealthUpdate(this.player.health, this.player.maxHealth);
		}
		if (this.onLivesUpdate) {
			this.onLivesUpdate(this.player.lives);
		}
		if (this.onBombsUpdate) {
			this.onBombsUpdate(this.player.bombs);
		}
	}

	private render(): void {
		const ctx = this.ctx;
		const colors = this.getPresetColors();
		const dpr = window.devicePixelRatio || 1;
		const canvasWidth = this.width / dpr;
		const canvasHeight = this.height / dpr;

		ctx.save();
		ctx.translate(this.shakeX, this.shakeY);

		ctx.fillStyle = colors.background;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		this.renderNebulae();
		this.renderStars();

		if (this.spectrumData) {
			this.renderSpectrumVisualizer();
		}

		this.renderParticles();
		this.renderPowerUps();
		this.renderEnemies();
		this.renderPlayerBullets();
		this.renderEnemyBullets();
		this.renderPlayer();

		this.renderBeatIndicators();

		if (this.shieldActive) {
			this.renderShield();
		}

		ctx.restore();
	}

	private renderStars(): void {
		const ctx = this.ctx;

		this.stars.forEach((star) => {
			const alpha = 0.5 + star.brightness * 0.5;
			ctx.beginPath();
			ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
			ctx.fillStyle = star.color;
			ctx.globalAlpha = alpha;
			ctx.fill();
			ctx.globalAlpha = 1;
		});
	}

	private renderNebulae(): void {
		const ctx = this.ctx;

		this.nebulae.forEach((nebula) => {
			const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
			gradient.addColorStop(0, nebula.color);
			gradient.addColorStop(1, 'transparent');

			ctx.beginPath();
			ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
			ctx.fillStyle = gradient;
			ctx.fill();
		});
	}

	private renderSpectrumVisualizer(): void {
		if (!this.spectrumData) return;

		const ctx = this.ctx;
		const colors = this.getPresetColors();
		const dpr = window.devicePixelRatio || 1;
		const canvasWidth = this.width / dpr;
		const spectrum = this.spectrumData.fullSpectrum;

		const barCount = 64;
		const barWidth = canvasWidth / barCount;
		const maxHeight = 100;

		for (let i = 0; i < barCount; i++) {
			const spectrumIndex = Math.floor((i / barCount) * spectrum.length);
			const value = spectrum[spectrumIndex] / 255;
			const height = value * maxHeight;

			const gradient = ctx.createLinearGradient(0, 0, 0, -height);
			gradient.addColorStop(0, colors.accent);
			gradient.addColorStop(1, colors.glow);

			ctx.fillStyle = gradient;
			ctx.globalAlpha = value * 0.3;

			ctx.fillRect(i * barWidth, 0, barWidth - 1, height);
			ctx.fillRect(i * barWidth, 0, barWidth - 1, -height);

			ctx.globalAlpha = 1;
		}
	}

	private renderPlayer(): void {
		const ctx = this.ctx;
		const colors = this.getPresetColors();

		ctx.save();
		ctx.translate(this.player.position.x, this.player.position.y);

		if (this.player.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
			ctx.globalAlpha = 0.5;
		}

		ctx.beginPath();
		ctx.moveTo(0, -this.player.radius);
		ctx.lineTo(-this.player.radius * 0.8, this.player.radius);
		ctx.lineTo(0, this.player.radius * 0.6);
		ctx.lineTo(this.player.radius * 0.8, this.player.radius);
		ctx.closePath();

		const gradient = ctx.createLinearGradient(0, -this.player.radius, 0, this.player.radius);
		gradient.addColorStop(0, colors.playerShip);
		gradient.addColorStop(1, colors.accent);

		ctx.fillStyle = gradient;
		ctx.fill();

		ctx.strokeStyle = colors.glow;
		ctx.lineWidth = 2;
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(-this.player.radius * 0.4, this.player.radius);
		ctx.lineTo(0, this.player.radius + 15 + Math.random() * 10);
		ctx.lineTo(this.player.radius * 0.4, this.player.radius);
		ctx.closePath();
		ctx.fillStyle = colors.accent;
		ctx.fill();

		ctx.restore();
	}

	private renderEnemies(): void {
		const ctx = this.ctx;

		this.enemies.forEach((enemy) => {
			ctx.save();
			ctx.translate(enemy.position.x, enemy.position.y);

			switch (enemy.type) {
				case 'scout':
					this.renderTriangleEnemy(ctx, enemy);
					break;
				case 'fighter':
					this.renderDiamondEnemy(ctx, enemy);
					break;
				case 'cruiser':
					this.renderHexEnemy(ctx, enemy);
					break;
				case 'boss':
					this.renderBossEnemy(ctx, enemy);
					break;
			}

			if (enemy.health < enemy.maxHealth) {
				const healthPercent = enemy.health / enemy.maxHealth;
				const barWidth = enemy.radius * 2;
				const barHeight = 4;

				ctx.fillStyle = '#333';
				ctx.fillRect(-barWidth / 2, -enemy.radius - 15, barWidth, barHeight);

				ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
				ctx.fillRect(-barWidth / 2, -enemy.radius - 15, barWidth * healthPercent, barHeight);
			}

			ctx.restore();
		});
	}

	private renderTriangleEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
		ctx.beginPath();
		ctx.moveTo(0, enemy.radius);
		ctx.lineTo(-enemy.radius, -enemy.radius);
		ctx.lineTo(enemy.radius, -enemy.radius);
		ctx.closePath();

		ctx.fillStyle = enemy.color;
		ctx.fill();
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 1;
		ctx.stroke();
	}

	private renderDiamondEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
		ctx.beginPath();
		ctx.moveTo(0, enemy.radius);
		ctx.lineTo(-enemy.radius, 0);
		ctx.lineTo(0, -enemy.radius);
		ctx.lineTo(enemy.radius, 0);
		ctx.closePath();

		const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.radius);
		gradient.addColorStop(0, 'white');
		gradient.addColorStop(1, enemy.color);

		ctx.fillStyle = gradient;
		ctx.fill();
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	private renderHexEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
		ctx.beginPath();
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i;
			const x = Math.cos(angle) * enemy.radius;
			const y = Math.sin(angle) * enemy.radius;
			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.closePath();

		const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.radius);
		gradient.addColorStop(0, enemy.color);
		gradient.addColorStop(1, 'rgba(0,0,0,0.5)');

		ctx.fillStyle = gradient;
		ctx.fill();
		ctx.strokeStyle = enemy.color;
		ctx.lineWidth = 3;
		ctx.stroke();
	}

	private renderBossEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
		const colors = this.getPresetColors();

		ctx.beginPath();
		ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
		const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.radius);
		gradient.addColorStop(0, 'white');
		gradient.addColorStop(0.5, enemy.color);
		gradient.addColorStop(1, colors.background);
		ctx.fillStyle = gradient;
		ctx.fill();

		ctx.beginPath();
		ctx.arc(0, 0, enemy.radius + 5, 0, Math.PI * 2);
		ctx.strokeStyle = colors.accent;
		ctx.lineWidth = 3;
		ctx.setLineDash([10, 5]);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	private renderPlayerBullets(): void {
		const ctx = this.ctx;

		this.playerBullets.forEach((bullet) => {
			ctx.save();
			ctx.translate(bullet.position.x, bullet.position.y);

			this.renderBulletShape(ctx, bullet);

			ctx.shadowColor = bullet.color;
			ctx.shadowBlur = 10;

			ctx.fillStyle = bullet.color;
			ctx.fill();

			ctx.shadowBlur = 0;
			ctx.restore();
		});
	}

	private renderEnemyBullets(): void {
		const ctx = this.ctx;

		this.enemyBullets.forEach((bullet) => {
			ctx.save();
			ctx.translate(bullet.position.x, bullet.position.y);

			ctx.beginPath();
			ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
			ctx.fillStyle = bullet.color;
			ctx.shadowColor = bullet.color;
			ctx.shadowBlur = 8;
			ctx.fill();
			ctx.shadowBlur = 0;

			ctx.restore();
		});
	}

	private renderBulletShape(ctx: CanvasRenderingContext2D, bullet: Bullet): void {
		const size = bullet.size;

		switch (bullet.pattern) {
			case 'circle':
				ctx.beginPath();
				ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
				break;
			case 'diamond':
				ctx.beginPath();
				ctx.moveTo(0, -size / 2);
				ctx.lineTo(size / 2, 0);
				ctx.lineTo(0, size / 2);
				ctx.lineTo(-size / 2, 0);
				ctx.closePath();
				break;
			case 'triangle':
				ctx.beginPath();
				ctx.moveTo(0, -size / 2);
				ctx.lineTo(size / 2, size / 2);
				ctx.lineTo(-size / 2, size / 2);
				ctx.closePath();
				break;
			case 'star':
				ctx.beginPath();
				for (let i = 0; i < 5; i++) {
					const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
					const innerAngle = angle + Math.PI / 5;
					if (i === 0) {
						ctx.moveTo(Math.cos(angle) * size / 2, Math.sin(angle) * size / 2);
					} else {
						ctx.lineTo(Math.cos(angle) * size / 2, Math.sin(angle) * size / 2);
					}
					ctx.lineTo(Math.cos(innerAngle) * size / 4, Math.sin(innerAngle) * size / 4);
				}
				ctx.closePath();
				break;
		}
	}

	private renderParticles(): void {
		const ctx = this.ctx;

		this.particles.forEach((particle) => {
			ctx.save();
			ctx.globalAlpha = particle.alpha;

			ctx.beginPath();
			ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
			ctx.fillStyle = particle.color;
			ctx.fill();

			ctx.globalAlpha = 1;
			ctx.restore();
		});
	}

	private renderPowerUps(): void {
		const ctx = this.ctx;
		const colors = this.getPresetColors();

		this.powerUps.forEach((powerUp) => {
			ctx.save();
			ctx.translate(powerUp.position.x, powerUp.position.y);

			const pulse = 1 + Math.sin(Date.now() / 200) * 0.2;

			ctx.beginPath();
			ctx.arc(0, 0, powerUp.radius * pulse, 0, Math.PI * 2);

			let color: string;
			switch (powerUp.type) {
				case 'health':
					color = '#00ff00';
					break;
				case 'bomb':
					color = '#ff6600';
					break;
				case 'rapidFire':
					color = '#ffff00';
					break;
				case 'shield':
					color = '#00ffff';
					break;
			}

			const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.radius * pulse);
			gradient.addColorStop(0, 'white');
			gradient.addColorStop(1, color);

			ctx.fillStyle = gradient;
			ctx.shadowColor = color;
			ctx.shadowBlur = 15;
			ctx.fill();

			ctx.shadowBlur = 0;
			ctx.restore();
		});
	}

	private renderShield(): void {
		const ctx = this.ctx;
		const colors = this.getPresetColors();

		ctx.save();
		ctx.translate(this.player.position.x, this.player.position.y);

		const radius = this.player.radius + 20;
		const alpha = 0.3 + Math.sin(Date.now() / 200) * 0.1;

		ctx.beginPath();
		ctx.arc(0, 0, radius, 0, Math.PI * 2);
		ctx.strokeStyle = colors.accent;
		ctx.lineWidth = 3;
		ctx.globalAlpha = alpha;
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(0, 0, radius - 5, 0, Math.PI * 2);
		ctx.strokeStyle = colors.glow;
		ctx.lineWidth = 2;
		ctx.stroke();

		ctx.globalAlpha = 1;
		ctx.restore();
	}

	private renderBeatIndicators(): void {
		if (!this.spectrumData) return;

		const ctx = this.ctx;
		const colors = this.getPresetColors();
		const dpr = window.devicePixelRatio || 1;
		const canvasHeight = this.height / dpr;

		const indicatorWidth = 60;
		const indicatorHeight = 8;
		const margin = 20;
		const startY = canvasHeight - margin - indicatorHeight;

		ctx.fillStyle = '#333';
		ctx.fillRect(margin, startY, indicatorWidth, indicatorHeight);
		ctx.fillStyle = '#ff0066';
		ctx.fillRect(margin, startY, indicatorWidth * this.spectrumData.bass, indicatorHeight);

		ctx.fillStyle = '#333';
		ctx.fillRect(margin, startY - 15, indicatorWidth, indicatorHeight);
		ctx.fillStyle = '#ffff00';
		ctx.fillRect(margin, startY - 15, indicatorWidth * this.spectrumData.mid, indicatorHeight);

		ctx.fillStyle = '#333';
		ctx.fillRect(margin, startY - 30, indicatorWidth, indicatorHeight);
		ctx.fillStyle = '#00ffff';
		ctx.fillRect(margin, startY - 30, indicatorWidth * this.spectrumData.treble, indicatorHeight);
	}

	dispose(): void {
		this.stop();
		this.audioAnalyzer.dispose();

		window.removeEventListener('keydown', () => {});
		window.removeEventListener('keyup', () => {});
		window.removeEventListener('resize', () => {});
	}
}
