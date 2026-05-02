<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gameState } from '$lib/stores/gameStores';
	import MainMenu from '$lib/components/MainMenu.svelte';
	import GameCanvas from '$lib/components/GameCanvas.svelte';
	import NeonButton from '$lib/components/NeonButton.svelte';
	import type { GameState } from '$lib/types/game';

	let currentState: GameState = $state('menu');
	let gameFinalScore: number = $state(0);
	let isPaused: boolean = $state(false);

	let unsubscribeGameState: (() => void) | null = null;

	onMount(() => {
		unsubscribeGameState = gameState.subscribe((state) => {
			currentState = state;
			isPaused = state === 'paused';
		});
	});

	onDestroy(() => {
		if (unsubscribeGameState) {
			unsubscribeGameState();
		}
	});

	function handleGameOver(score: number): void {
		gameFinalScore = score;
		gameState.set('gameover');
	}

	function returnToMenu(): void {
		gameState.set('menu');
	}

	function restartGame(): void {
		gameState.set('menu');
		gameState.set('playing');
	}

	function resumeGame(): void {
		gameState.set('playing');
	}

	function pauseGame(): void {
		gameState.set('paused');
	}
</script>

<div class="page-container">
	{#if currentState === 'menu'}
		<MainMenu />
	{:else if currentState === 'playing' || currentState === 'paused'}
		<div class="game-screen">
			<GameCanvas
				onGameOver={handleGameOver}
			/>

			{#if isPaused}
				<div class="pause-overlay">
					<div class="pause-content">
						<h2 class="pause-title">游戏暂停</h2>

						<div class="pause-actions">
							<NeonButton variant="primary" size="lg" onclick={resumeGame}>
								▶️ 继续游戏
							</NeonButton>
							<NeonButton variant="secondary" size="lg" onclick={returnToMenu}>
								🏠 返回菜单
							</NeonButton>
						</div>
					</div>
				</div>
			{/if}

			<button class="pause-btn" onclick={pauseGame} aria-label="暂停游戏">
				⏸️
			</button>
		</div>
	{:else if currentState === 'gameover'}
		<div class="gameover-screen">
			<div class="gameover-content">
				<div class="gameover-header">
					<h1 class="gameover-title">游戏结束</h1>
					<div class="gameover-score">
						<span class="score-label">最终得分</span>
						<span class="score-value neon-text">{gameFinalScore.toLocaleString()}</span>
					</div>
				</div>

				<div class="gameover-stats">
					<div class="stat-item">
						<span class="stat-icon">🎮</span>
						<span class="stat-label">再接再厉!</span>
					</div>
				</div>

				<div class="gameover-actions">
					<NeonButton variant="primary" size="lg" onclick={restartGame}>
						🔄 再来一局
					</NeonButton>
					<NeonButton variant="secondary" size="lg" onclick={returnToMenu}>
						🏠 返回菜单
					</NeonButton>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.page-container {
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
	}

	.game-screen {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.pause-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.5);
		border: 2px solid var(--accent-cyan);
		color: var(--accent-cyan);
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		z-index: 100;
	}

	.pause-btn:hover {
		background: rgba(0, 255, 255, 0.2);
		box-shadow: 0 0 15px var(--accent-cyan);
	}

	.pause-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.pause-content {
		text-align: center;
		padding: 2rem;
	}

	.pause-title {
		font-family: var(--font-primary);
		font-size: 2.5rem;
		color: var(--accent-cyan);
		margin: 0 0 2rem;
		text-shadow: 0 0 20px var(--accent-cyan), 0 0 40px var(--accent-cyan);
	}

	.pause-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.gameover-screen {
		width: 100%;
		height: 100%;
		background: linear-gradient(180deg, var(--bg-primary), var(--bg-secondary));
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.5s ease;
		overflow-y: auto;
	}

	.gameover-content {
		text-align: center;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
	}

	.gameover-header {
		margin-bottom: 2rem;
	}

	.gameover-title {
		font-family: var(--font-primary);
		font-size: clamp(2rem, 6vw, 3rem);
		color: var(--accent-red);
		margin: 0 0 1.5rem;
		text-shadow: 0 0 20px var(--accent-red), 0 0 40px var(--accent-red);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	.gameover-score {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.score-label {
		font-family: var(--font-secondary);
		font-size: 1rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.score-value {
		font-family: var(--font-primary);
		font-size: clamp(2rem, 8vw, 4rem);
		font-weight: 900;
		color: var(--accent-cyan);
	}

	.gameover-stats {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
	}

	.stat-item {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.stat-icon {
		font-size: 2rem;
	}

	.stat-label {
		font-family: var(--font-primary);
		font-size: 1.25rem;
		color: var(--accent-magenta);
	}

	.gameover-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.neon-text {
		text-shadow: 0 0 10px var(--accent-cyan), 0 0 20px var(--accent-cyan), 0 0 40px var(--accent-cyan);
	}

	@media (max-width: 768px) {
		.pause-btn {
			top: 0.5rem;
			right: 0.5rem;
			width: 40px;
			height: 40px;
			font-size: 1.25rem;
		}

		.pause-title {
			font-size: 1.75rem;
		}

		.gameover-content {
			padding: 1rem;
		}

		.gameover-stats {
			padding: 1rem;
		}
	}

	@media (max-width: 480px) {
		.pause-content {
			padding: 1rem;
		}

		.pause-title {
			font-size: 1.5rem;
		}
	}
</style>
