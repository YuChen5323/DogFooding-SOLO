<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { GameEngine } from '$lib/game/GameEngine';
	import { settings, gameState, currentLevel } from '$lib/stores/gameStores';
	import { loadSettings, saveSettings, updateHighScore, updateGameStats } from '$lib/utils/storage';
	import type { BeatEvent, SpectrumData, LevelData } from '$lib/types/game';
	import { get } from 'svelte/store';

	let {
		onGameOver
	}: {
		onGameOver?: ((score: number) => void);
	} = $props();

	let canvas: HTMLCanvasElement;
	let gameEngine: GameEngine | null = null;
	let isInitialized: boolean = $state(false);
	let unsubscribeGameState: (() => void) | null = null;

	let score: number = $state(0);
	let health: number = $state(100);
	let maxHealth: number = $state(100);
	let lives: number = $state(3);
	let bombs: number = $state(2);
	let spectrumData: SpectrumData | null = $state(null);
	let isPaused: boolean = $state(false);

	async function initGame(): Promise<void> {
		if (gameEngine) return;

		await tick();

		if (!canvas) {
			console.error('Canvas element not found');
			return;
		}

		const savedSettings = loadSettings();
		settings.set(savedSettings);

		gameEngine = new GameEngine(canvas);

		const $settings = get(settings);
		gameEngine.setVisualPreset($settings.visualPreset);
		gameEngine.setDifficulty($settings.difficulty);

		const audioAnalyzer = gameEngine.getAudioAnalyzer();
		audioAnalyzer.setVolume($settings.musicVolume);

		gameEngine.setOnGameOver((finalScore: number) => {
			score = finalScore;
			const $currentLevel = get(currentLevel);
			if ($currentLevel) {
				updateHighScore($currentLevel.id, finalScore);
			}
			updateGameStats({
				score: finalScore,
				gamesPlayed: 1
			});
			if (onGameOver) {
				onGameOver(finalScore);
			}
		});

		gameEngine.setOnScoreUpdate((newScore: number) => {
			score = newScore;
		});

		gameEngine.setOnHealthUpdate((newHealth: number, newMaxHealth: number) => {
			health = newHealth;
			maxHealth = newMaxHealth;
		});

		gameEngine.setOnLivesUpdate((newLives: number) => {
			lives = newLives;
		});

		gameEngine.setOnBombsUpdate((newBombs: number) => {
			bombs = newBombs;
		});

		gameEngine.setOnSpectrumUpdate((data: SpectrumData) => {
			spectrumData = data;
		});

		gameEngine.setOnBeat((event: BeatEvent) => {
		});

		gameEngine.resize();
		isInitialized = true;
	}

	export async function startGame(levelData: LevelData | null = null): Promise<void> {
		if (!gameEngine) {
			await initGame();
			if (!gameEngine) return;
		}

		if (levelData) {
			const audioAnalyzer = gameEngine.getAudioAnalyzer();

			audioAnalyzer.setBeatEvents(levelData.beatEvents || []);
			gameEngine.setEnemySpawns(levelData.enemySpawns || []);
			gameEngine.setPowerUpSpawns(levelData.powerUpSpawns || []);
		}

		score = 0;
		health = 100;
		maxHealth = 100;
		lives = 3;
		bombs = 2;

		const $settings = get(settings);
		gameEngine.setVisualPreset($settings.visualPreset);
		gameEngine.setDifficulty($settings.difficulty);

		gameEngine.start();
		isPaused = false;
		gameState.set('playing');
	}

	export function pauseGame(): void {
		if (!gameEngine) return;
		gameEngine.togglePause();
		isPaused = gameEngine.getIsPaused();
		gameState.set(isPaused ? 'paused' : 'playing');
	}

	export function resumeGame(): void {
		if (!gameEngine) return;
		gameEngine.togglePause();
		isPaused = gameEngine.getIsPaused();
		gameState.set('playing');
	}

	export function stopGame(): void {
		if (!gameEngine) return;
		gameEngine.stop();
		isPaused = false;
	}

	export function getGameEngine(): GameEngine | null {
		return gameEngine;
	}

	function handleResize(): void {
		if (gameEngine) {
			gameEngine.resize();
		}
	}

	onMount(() => {
		initGame();
		window.addEventListener('resize', handleResize);

		unsubscribeGameState = gameState.subscribe((state) => {
			if (state === 'playing' && gameEngine) {
				const currentlyPaused = gameEngine.getIsPaused();
				if (currentlyPaused) {
					gameEngine.togglePause();
					isPaused = false;
				}
			} else if (state === 'paused' && gameEngine) {
				const currentlyPaused = gameEngine.getIsPaused();
				if (!currentlyPaused) {
					gameEngine.togglePause();
					isPaused = true;
				}
			} else if (state === 'menu' && gameEngine) {
				gameEngine.stop();
				isPaused = false;
			}
		});
	});

	onDestroy(() => {
		window.removeEventListener('resize', handleResize);
		if (unsubscribeGameState) {
			unsubscribeGameState();
		}
		if (gameEngine) {
			gameEngine.dispose();
			gameEngine = null;
		}
		isInitialized = false;
	});
</script>

<div class="game-canvas-container">
	<canvas
		bind:this={canvas}
		class="game-canvas"
		touch-action="none"
		aria-label="游戏画布"
	/>

	{#if isInitialized}
		<div class="game-hud">
			<div class="hud-top">
				<div class="hud-score">
					<span class="hud-label">SCORE</span>
					<span class="hud-value neon-text">{score.toLocaleString()}</span>
				</div>

				<div class="hud-right">
					<div class="hud-lives">
						{#each Array(lives) as _, i}
							<span class="heart" class:empty={i >= lives}>♥</span>
						{/each}
					</div>

					<div class="hud-bombs">
						<span class="bomb-icon">💣</span>
						<span class="hud-value">{bombs}</span>
					</div>
				</div>
			</div>

			<div class="hud-bottom">
				<div class="health-bar-container">
					<div class="health-bar-bg"></div>
					<div
						class="health-bar-fill"
						style="width: {(health / maxHealth) * 100}%"
					></div>
					<span class="health-text">{health}/{maxHealth}</span>
				</div>

				{#if spectrumData}
					<div class="spectrum-indicators">
						<div class="spectrum-bar bass" style="height: {spectrumData.bass * 30}px"></div>
						<div class="spectrum-bar mid" style="height: {spectrumData.mid * 30}px"></div>
						<div class="spectrum-bar treble" style="height: {spectrumData.treble * 30}px"></div>
					</div>
				{/if}
			</div>
		</div>

		<div class="touch-controls">
			<div class="touch-zone touch-zone-left" aria-label="移动控制">
				<span class="touch-label">移动</span>
			</div>
			<div class="touch-zone touch-zone-right">
				<div class="touch-zone-fire" aria-label="射击">
					<span class="touch-label">射击</span>
				</div>
				<div class="touch-zone-bomb" aria-label="炸弹">
					<span class="touch-label">炸弹</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.game-canvas-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: var(--bg-primary);
	}

	.game-canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}

	.game-hud {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.hud-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.hud-score {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.hud-label {
		font-family: var(--font-primary);
		font-size: 0.75rem;
		color: var(--accent-cyan);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-shadow: 0 0 10px var(--accent-cyan);
	}

	.hud-value {
		font-family: var(--font-primary);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.hud-right {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.hud-lives {
		display: flex;
		gap: 0.25rem;
	}

	.heart {
		font-size: 1.5rem;
		color: var(--accent-red);
		filter: drop-shadow(0 0 5px var(--accent-red));
	}

	.heart.empty {
		opacity: 0.3;
		filter: none;
	}

	.hud-bombs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bomb-icon {
		font-size: 1.5rem;
	}

	.hud-bottom {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.health-bar-container {
		position: relative;
		width: min(300px, 50%);
		height: 1.5rem;
	}

	.health-bar-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		border: 2px solid var(--accent-cyan);
		border-radius: 4px;
	}

	.health-bar-fill {
		position: absolute;
		top: 2px;
		left: 2px;
		bottom: 2px;
		background: linear-gradient(90deg, var(--accent-green), var(--accent-cyan));
		border-radius: 2px;
		transition: width 0.2s ease;
		box-shadow: 0 0 10px var(--accent-green);
	}

	.health-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: var(--font-primary);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		text-shadow: 0 0 5px var(--accent-cyan);
	}

	.spectrum-indicators {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
		height: 30px;
	}

	.spectrum-bar {
		width: 10px;
		background: linear-gradient(to top, var(--accent-cyan), var(--accent-magenta));
		border-radius: 2px 2px 0 0;
		transition: height 0.05s ease;
		box-shadow: 0 0 5px var(--accent-cyan);
	}

	.spectrum-bar.bass {
		background: linear-gradient(to top, var(--accent-red), var(--accent-orange));
		box-shadow: 0 0 5px var(--accent-red);
	}

	.spectrum-bar.mid {
		background: linear-gradient(to top, var(--accent-yellow), var(--accent-green));
		box-shadow: 0 0 5px var(--accent-yellow);
	}

	.spectrum-bar.treble {
		background: linear-gradient(to top, var(--accent-cyan), var(--accent-magenta));
		box-shadow: 0 0 5px var(--accent-cyan);
	}

	.touch-controls {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: none;
		pointer-events: auto;
	}

	@media (hover: none) and (pointer: coarse) {
		.touch-controls {
			display: flex;
		}
	}

	.touch-zone {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.touch-zone-left {
		flex: 1;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
	}

	.touch-zone-right {
		flex: 1;
		display: flex;
	}

	.touch-zone-fire {
		flex: 1;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.touch-zone-bomb {
		flex: 1;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
	}

	.touch-label {
		font-family: var(--font-primary);
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.neon-text {
		text-shadow: 0 0 10px var(--accent-cyan), 0 0 20px var(--accent-cyan), 0 0 30px var(--accent-cyan);
	}

	@media (max-width: 768px) {
		.game-hud {
			padding: 0.75rem;
		}

		.hud-value {
			font-size: 1.25rem;
		}

		.heart {
			font-size: 1.25rem;
		}

		.health-bar-container {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.hud-top {
			flex-direction: column;
			align-items: stretch;
		}

		.hud-right {
			justify-content: flex-end;
		}
	}
</style>
