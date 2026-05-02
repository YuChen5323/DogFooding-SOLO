<script lang="ts">
	import { onMount } from 'svelte';
	import { gameState, settings } from '$lib/stores/gameStores';
	import { getAllPresets } from '$lib/config/visualPresets';
	import { loadSettings, saveSettings, loadCustomLevels } from '$lib/utils/storage';
	import NeonButton from './NeonButton.svelte';
	import type { VisualPreset, Difficulty, LevelData } from '$lib/types/game';

	let showSettings: boolean = $state(false);
	let showLevelSelect: boolean = $state(false);
	let showEditor: boolean = $state(false);
	let localSettings = $state(loadSettings());
	let customLevels = $state<LevelData[]>([]);

	const presets = getAllPresets();
	const difficulties: Difficulty[] = ['easy', 'normal', 'hard', 'insane'];
	const difficultyNames: Record<Difficulty, string> = {
		easy: '简单',
		normal: '普通',
		hard: '困难',
		insane: '疯狂'
	};

	onMount(() => {
		customLevels = loadCustomLevels();
		localSettings = loadSettings();
	});

	function startGame(): void {
		gameState.set('playing');
	}

	function openLevelSelect(): void {
		showLevelSelect = true;
		customLevels = loadCustomLevels();
	}

	function openSettings(): void {
		localSettings = loadSettings();
		showSettings = true;
	}

	function openEditor(): void {
		showEditor = true;
	}

	function closeModal(): void {
		showSettings = false;
		showLevelSelect = false;
		showEditor = false;
	}

	function updateSetting<K extends keyof typeof localSettings>(key: K, value: typeof localSettings[K]): void {
		localSettings = { ...localSettings, [key]: value };
		settings.set(localSettings);
		saveSettings({ [key]: value } as any);
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="main-menu">
	<div class="menu-background">
		<div class="grid-lines"></div>
		<div class="floating-circles">
			<div class="circle circle-1"></div>
			<div class="circle circle-2"></div>
			<div class="circle circle-3"></div>
		</div>
	</div>

	<div class="menu-content">
		<div class="menu-header">
			<h1 class="title-neon">
				<span class="title-part">SPACE</span>
				<span class="title-separator">•</span>
				<span class="title-part">MUSIC</span>
			</h1>
			<p class="subtitle">太空音乐节奏射击</p>
			<div class="title-decoration">
				<span class="deco-line"></span>
				<span class="deco-star">★</span>
				<span class="deco-line"></span>
			</div>
		</div>

		<div class="menu-buttons">
			<NeonButton variant="primary" size="lg" fullWidth on:click={startGame}>
				🎮 开始游戏
			</NeonButton>

			<NeonButton variant="secondary" size="lg" fullWidth on:click={openLevelSelect}>
				📁 选择关卡
			</NeonButton>

			<NeonButton variant="success" size="lg" fullWidth on:click={openEditor}>
				🎵 曲目编辑器
			</NeonButton>

			<NeonButton variant="primary" size="md" fullWidth on:click={openSettings}>
				⚙️ 设置
			</NeonButton>
		</div>

		<div class="menu-footer">
			<p class="controls-hint">
				<span class="hint-key">WASD/方向键</span> 移动
				<span class="hint-separator">|</span>
				<span class="hint-key">B</span> 炸弹
				<span class="hint-separator">|</span>
				<span class="hint-key">ESC</span> 暂停
			</p>
		</div>
	</div>

	{#if showSettings}
		<div class="modal-overlay" on:click|self={closeModal}>
			<div class="modal-content modal-settings">
				<div class="modal-header">
					<h2>⚙️ 设置</h2>
					<button class="modal-close" on:click={closeModal}>✕</button>
				</div>

				<div class="settings-section">
					<h3 class="section-title">音量控制</h3>

					<div class="setting-item">
						<label class="setting-label">主音量</label>
						<div class="setting-control">
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								bind:value={localSettings.volume}
								on:input={(e) => updateSetting('volume', parseFloat((e.target as HTMLInputElement).value))}
							/>
							<span class="setting-value">{Math.round(localSettings.volume * 100)}%</span>
						</div>
					</div>

					<div class="setting-item">
						<label class="setting-label">音乐音量</label>
						<div class="setting-control">
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								bind:value={localSettings.musicVolume}
								on:input={(e) => updateSetting('musicVolume', parseFloat((e.target as HTMLInputElement).value))}
							/>
							<span class="setting-value">{Math.round(localSettings.musicVolume * 100)}%</span>
						</div>
					</div>

					<div class="setting-item">
						<label class="setting-label">音效音量</label>
						<div class="setting-control">
							<input
								type="range"
								min="0"
								max="1"
								step="0.01"
								bind:value={localSettings.sfxVolume}
								on:input={(e) => updateSetting('sfxVolume', parseFloat((e.target as HTMLInputElement).value))}
							/>
							<span class="setting-value">{Math.round(localSettings.sfxVolume * 100)}%</span>
						</div>
					</div>
				</div>

				<div class="settings-section">
					<h3 class="section-title">游戏设置</h3>

					<div class="setting-item">
						<label class="setting-label">难度</label>
						<div class="setting-control select-control">
							{#each difficulties as difficulty}
								<button
									class="preset-btn"
									class:active={localSettings.difficulty === difficulty}
									on:click={() => updateSetting('difficulty', difficulty)}
								>
									{difficultyNames[difficulty]}
								</button>
							{/each}
						</div>
					</div>

					<div class="setting-item">
						<label class="setting-label">灵敏度</label>
						<div class="setting-control">
							<input
								type="range"
								min="0.5"
								max="2"
								step="0.1"
								bind:value={localSettings.sensitivity}
								on:input={(e) => updateSetting('sensitivity', parseFloat((e.target as HTMLInputElement).value))}
							/>
							<span class="setting-value">{localSettings.sensitivity.toFixed(1)}x</span>
						</div>
					</div>
				</div>

				<div class="settings-section">
					<h3 class="section-title">可视化预设</h3>
					<div class="presets-grid">
						{#each presets as preset}
							<button
								class="preset-card"
								class:active={localSettings.visualPreset === preset.key}
								on:click={() => updateSetting('visualPreset', preset.key)}
								style="--preset-bg: {preset.config.background}; --preset-accent: {preset.config.accent};"
							>
								<div class="preset-preview">
									<div class="preview-stars">
										{#each Array(5) as _, i}
											<span class="preview-star" style="color: {preset.config.stars[i % preset.config.stars.length]}"></span>
										{/each}
									</div>
								</div>
								<span class="preset-name">{preset.config.name}</span>
							</button>
						{/each}
					</div>
				</div>

				<div class="settings-section">
					<h3 class="section-title">显示选项</h3>

					<div class="setting-item toggle-item">
						<label class="setting-label">屏幕震动</label>
						<button
							class="toggle-btn"
							class:active={localSettings.screenShake}
							on:click={() => updateSetting('screenShake', !localSettings.screenShake)}
						>
							<span class="toggle-slider"></span>
							<span class="toggle-label">{localSettings.screenShake ? '开' : '关'}</span>
						</button>
					</div>

					<div class="setting-item toggle-item">
						<label class="setting-label">显示 FPS</label>
						<button
							class="toggle-btn"
							class:active={localSettings.showFPS}
							on:click={() => updateSetting('showFPS', !localSettings.showFPS)}
						>
							<span class="toggle-slider"></span>
							<span class="toggle-label">{localSettings.showFPS ? '开' : '关'}</span>
						</button>
					</div>

					<div class="setting-item toggle-item">
						<label class="setting-label">节拍指示器</label>
						<button
							class="toggle-btn"
							class:active={localSettings.showBeatIndicators}
							on:click={() => updateSetting('showBeatIndicators', !localSettings.showBeatIndicators)}
						>
							<span class="toggle-slider"></span>
							<span class="toggle-label">{localSettings.showBeatIndicators ? '开' : '关'}</span>
						</button>
					</div>

					<div class="setting-item toggle-item">
						<label class="setting-label">震动反馈</label>
						<button
							class="toggle-btn"
							class:active={localSettings.vibration}
							on:click={() => updateSetting('vibration', !localSettings.vibration)}
						>
							<span class="toggle-slider"></span>
							<span class="toggle-label">{localSettings.vibration ? '开' : '关'}</span>
						</button>
					</div>
				</div>

				<div class="modal-actions">
					<NeonButton variant="secondary" size="md" on:click={closeModal}>
						关闭
					</NeonButton>
				</div>
			</div>
		</div>
	{/if}

	{#if showLevelSelect}
		<div class="modal-overlay" on:click|self={closeModal}>
			<div class="modal-content modal-levels">
				<div class="modal-header">
					<h2>📁 选择关卡</h2>
					<button class="modal-close" on:click={closeModal}>✕</button>
				</div>

				<div class="levels-list">
					<div class="level-item built-in">
						<div class="level-info">
							<h3 class="level-name">🎮 自由模式</h3>
							<p class="level-desc">无需音乐，体验实时节拍检测</p>
							<p class="level-meta">
								<span class="meta-tag built-in-tag">内置</span>
							</p>
						</div>
						<div class="level-actions">
							<NeonButton variant="primary" size="sm" on:click={startGame}>
								开始
							</NeonButton>
						</div>
					</div>

					{#if customLevels.length > 0}
						<h3 class="section-title">自定义关卡</h3>

						{#each customLevels as level}
							<div class="level-item">
								<div class="level-info">
									<h3 class="level-name">{level.name}</h3>
									<p class="level-desc">{level.description || '无描述'}</p>
									<p class="level-meta">
										<span class="meta-tag author-tag">作者: {level.author || '未知'}</span>
										<span class="meta-tag duration-tag">时长: {formatTime(level.duration)}</span>
										<span class="meta-tag difficulty-tag">{difficultyNames[level.difficulty]}</span>
									</p>
								</div>
								<div class="level-actions">
									<NeonButton variant="primary" size="sm">
										开始
									</NeonButton>
								</div>
							</div>
						{/each}
					{/if}

					{#if customLevels.length === 0}
						<div class="empty-state">
							<p class="empty-text">暂无自定义关卡</p>
							<p class="empty-hint">使用曲目编辑器创建你的第一个关卡</p>
							<NeonButton variant="success" size="md" on:click={() => { closeModal(); openEditor(); }}>
								🎵 去创建
							</NeonButton>
						</div>
					{/if}
				</div>

				<div class="modal-actions">
					<NeonButton variant="secondary" size="md" on:click={closeModal}>
						返回
					</NeonButton>
				</div>
			</div>
		</div>
	{/if}

	{#if showEditor}
		<div class="modal-overlay" on:click|self={closeModal}>
			<div class="modal-content modal-editor">
				<div class="modal-header">
					<h2>🎵 曲目编辑器</h2>
					<button class="modal-close" on:click={closeModal}>✕</button>
				</div>

				<div class="editor-content">
					<div class="editor-step">
						<div class="step-icon">1</div>
						<div class="step-content">
							<h3 class="step-title">加载音乐</h3>
							<p class="step-desc">选择一个 MP3 或 WAV 文件</p>

							<div class="file-upload" id="file-upload-zone">
								<input type="file" id="audio-file-input" accept=".mp3,.wav,.ogg,.m4a" hidden />
								<label for="audio-file-input" class="upload-label">
									<span class="upload-icon">🎵</span>
									<span class="upload-text">点击或拖拽文件到这里</span>
								</label>
							</div>
						</div>
					</div>

					<div class="editor-step">
						<div class="step-icon">2</div>
						<div class="step-content">
							<h3 class="step-title">分析节拍</h3>
							<p class="step-desc">播放音乐，系统将自动检测节拍</p>

							<div class="editor-controls">
								<NeonButton variant="primary" size="sm" disabled>
									▶️ 播放
								</NeonButton>
								<NeonButton variant="secondary" size="sm" disabled>
									⏸️ 暂停
								</NeonButton>
								<NeonButton variant="success" size="sm" disabled>
									📊 自动分析
								</NeonButton>
							</div>

							<div class="waveform-placeholder">
								<span class="placeholder-text">加载音乐后显示波形</span>
							</div>
						</div>
					</div>

					<div class="editor-step">
						<div class="step-icon">3</div>
						<div class="step-content">
							<h3 class="step-title">标记敌人生成点</h3>
							<p class="step-desc">在时间轴上点击添加敌人生成点</p>

							<div class="enemy-types">
								<span class="enemy-type-btn scout">侦察机</span>
								<span class="enemy-type-btn fighter">战斗机</span>
								<span class="enemy-type-btn cruiser">巡洋舰</span>
								<span class="enemy-type-btn boss">BOSS</span>
							</div>
						</div>
					</div>

					<div class="editor-step">
						<div class="step-icon">4</div>
						<div class="step-content">
							<h3 class="step-title">导出关卡</h3>
							<p class="step-desc">设置关卡信息并导出 JSON 文件</p>

							<div class="level-form">
								<div class="form-group">
									<label class="form-label">关卡名称</label>
									<input type="text" class="form-input" placeholder="输入关卡名称..." disabled />
								</div>
								<div class="form-group">
									<label class="form-label">作者</label>
									<input type="text" class="form-input" placeholder="你的名字..." disabled />
								</div>
								<div class="form-group">
									<label class="form-label">描述</label>
									<textarea class="form-textarea" placeholder="关卡描述..." disabled></textarea>
								</div>
								<div class="form-group">
									<label class="form-label">难度</label>
									<select class="form-select" disabled>
										{#each difficulties as difficulty}
											<option value={difficulty}>{difficultyNames[difficulty]}</option>
										{/each}
									</select>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="modal-actions">
					<NeonButton variant="success" size="md" disabled>
						💾 保存关卡
					</NeonButton>
					<NeonButton variant="primary" size="md" disabled>
						📤 导出 JSON
					</NeonButton>
					<NeonButton variant="secondary" size="md" on:click={closeModal}>
						关闭
					</NeonButton>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.main-menu {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.menu-background {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		overflow: hidden;
	}

	.grid-lines {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image:
			linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
		background-size: 50px 50px;
		transform: perspective(500px) rotateX(60deg);
		transform-origin: center bottom;
		animation: gridScroll 20s linear infinite;
	}

	@keyframes gridScroll {
		from {
			background-position: 0 0;
		}
		to {
			background-position: 0 100px;
		}
	}

	.floating-circles {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
	}

	.circle {
		position: absolute;
		border-radius: 50%;
		opacity: 0.3;
		filter: blur(50px);
		animation: float 8s ease-in-out infinite;
	}

	.circle-1 {
		width: 300px;
		height: 300px;
		background: var(--accent-cyan);
		top: 10%;
		left: 10%;
	}

	.circle-2 {
		width: 400px;
		height: 400px;
		background: var(--accent-magenta);
		top: 50%;
		right: 10%;
		animation-delay: -2s;
	}

	.circle-3 {
		width: 250px;
		height: 250px;
		background: var(--accent-yellow);
		bottom: 10%;
		left: 30%;
		animation-delay: -4s;
	}

	@keyframes float {
		0%, 100% {
			transform: translate(0, 0) scale(1);
		}
		25% {
			transform: translate(20px, -20px) scale(1.05);
		}
		50% {
			transform: translate(-10px, 10px) scale(0.95);
		}
		75% {
			transform: translate(15px, 15px) scale(1.02);
		}
	}

	.menu-content {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3rem;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
	}

	.menu-header {
		text-align: center;
	}

	.title-neon {
		font-family: var(--font-primary);
		font-size: clamp(2rem, 8vw, 4rem);
		font-weight: 900;
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.title-part {
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.title-part:first-child {
		color: var(--accent-cyan);
		text-shadow: 0 0 10px var(--accent-cyan), 0 0 20px var(--accent-cyan), 0 0 40px var(--accent-cyan);
		animation: titlePulse 2s ease-in-out infinite;
	}

	.title-part:last-child {
		color: var(--accent-magenta);
		text-shadow: 0 0 10px var(--accent-magenta), 0 0 20px var(--accent-magenta), 0 0 40px var(--accent-magenta);
		animation: titlePulse 2s ease-in-out infinite 1s;
	}

	@keyframes titlePulse {
		0%, 100% {
			opacity: 1;
			filter: brightness(1);
		}
		50% {
			opacity: 0.9;
			filter: brightness(1.2);
		}
	}

	.title-separator {
		color: var(--accent-yellow);
		text-shadow: 0 0 10px var(--accent-yellow);
		animation: separatorGlow 1.5s ease-in-out infinite;
	}

	@keyframes separatorGlow {
		0%, 100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	.subtitle {
		font-family: var(--font-secondary);
		font-size: 1.25rem;
		color: var(--text-secondary);
		margin: 0.5rem 0 1rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.title-decoration {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.deco-line {
		width: 60px;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--accent-cyan), var(--accent-magenta), transparent);
	}

	.deco-star {
		color: var(--accent-yellow);
		font-size: 1.5rem;
		animation: starSpin 4s linear infinite;
		filter: drop-shadow(0 0 5px var(--accent-yellow));
	}

	@keyframes starSpin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.menu-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 300px;
	}

	.menu-footer {
		text-align: center;
	}

	.controls-hint {
		font-family: var(--font-secondary);
		font-size: 0.875rem;
		color: var(--text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.hint-key {
		color: var(--accent-cyan);
		font-family: var(--font-primary);
		font-size: 0.75rem;
	}

	.hint-separator {
		color: var(--text-muted);
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(5px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		position: relative;
		background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
		border: 2px solid var(--accent-cyan);
		border-radius: 8px;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		width: 100%;
		animation: slideIn 0.3s ease;
		box-shadow: 0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.05);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--accent-cyan);
		text-shadow: 0 0 10px var(--accent-cyan);
	}

	.modal-close {
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 1.5rem;
		cursor: pointer;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.modal-close:hover {
		color: var(--accent-red);
		background: rgba(255, 0, 102, 0.1);
	}

	.settings-section {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.settings-section:last-child {
		border-bottom: none;
	}

	.section-title {
		font-family: var(--font-primary);
		font-size: 1rem;
		color: var(--accent-magenta);
		margin: 0 0 1rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.setting-item:last-child {
		margin-bottom: 0;
	}

	.setting-item.toggle-item {
		padding: 0.5rem 0;
	}

	.setting-label {
		font-family: var(--font-secondary);
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.setting-control {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
		max-width: 300px;
	}

	.setting-control input[type='range'] {
		flex: 1;
		height: 6px;
		background: var(--bg-tertiary);
		border-radius: 3px;
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
	}

	.setting-control input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		background: var(--accent-cyan);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 0 10px var(--accent-cyan);
	}

	.setting-value {
		font-family: var(--font-primary);
		color: var(--accent-cyan);
		min-width: 50px;
		text-align: right;
	}

	.select-control {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.preset-btn {
		padding: 0.5rem 1rem;
		border: 2px solid var(--border-color);
		background: transparent;
		color: var(--text-secondary);
		font-family: var(--font-primary);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.preset-btn:hover {
		border-color: var(--accent-cyan);
		color: var(--accent-cyan);
	}

	.preset-btn.active {
		border-color: var(--accent-cyan);
		background: rgba(0, 255, 255, 0.1);
		color: var(--accent-cyan);
		box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
	}

	.presets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 1rem;
	}

	.preset-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 2px solid var(--border-color);
		background: var(--bg-tertiary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.preset-card:hover {
		border-color: var(--accent-cyan);
		transform: translateY(-2px);
	}

	.preset-card.active {
		border-color: var(--accent-cyan);
		box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
	}

	.preset-preview {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: var(--preset-bg, var(--bg-primary));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-stars {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
	}

	.preview-star {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: currentColor;
	}

	.preset-name {
		font-family: var(--font-primary);
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.toggle-slider {
		position: relative;
		width: 50px;
		height: 26px;
		background: var(--bg-tertiary);
		border: 2px solid var(--border-color);
		border-radius: 13px;
		transition: all 0.2s ease;
	}

	.toggle-slider::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: var(--text-secondary);
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.toggle-btn.active .toggle-slider {
		background: rgba(0, 255, 255, 0.2);
		border-color: var(--accent-cyan);
	}

	.toggle-btn.active .toggle-slider::after {
		left: 28px;
		background: var(--accent-cyan);
		box-shadow: 0 0 10px var(--accent-cyan);
	}

	.toggle-label {
		font-family: var(--font-primary);
		font-size: 0.875rem;
		color: var(--text-secondary);
		min-width: 24px;
	}

	.modal-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.modal-levels {
		max-height: 80vh;
	}

	.levels-list {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.level-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 1rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.level-item:hover {
		border-color: var(--accent-cyan);
	}

	.level-item.built-in {
		border-color: var(--accent-green);
		background: rgba(0, 255, 0, 0.05);
	}

	.level-info {
		flex: 1;
	}

	.level-name {
		font-family: var(--font-primary);
		font-size: 1rem;
		color: var(--text-primary);
		margin: 0 0 0.25rem;
	}

	.level-desc {
		font-family: var(--font-secondary);
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0 0 0.5rem;
	}

	.level-meta {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.meta-tag {
		font-family: var(--font-primary);
		font-size: 0.65rem;
		padding: 0.25rem 0.5rem;
		border-radius: 2px;
		text-transform: uppercase;
	}

	.built-in-tag {
		background: rgba(0, 255, 0, 0.2);
		color: var(--accent-green);
	}

	.author-tag {
		background: rgba(0, 255, 255, 0.2);
		color: var(--accent-cyan);
	}

	.duration-tag {
		background: rgba(255, 255, 0, 0.2);
		color: var(--accent-yellow);
	}

	.difficulty-tag {
		background: rgba(255, 0, 255, 0.2);
		color: var(--accent-magenta);
	}

	.level-actions {
		flex-shrink: 0;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.empty-text {
		font-family: var(--font-primary);
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.empty-hint {
		font-family: var(--font-secondary);
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0;
	}

	.modal-editor {
		max-width: 700px;
		max-height: 90vh;
	}

	.editor-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
	}

	.editor-step {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.step-icon {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--accent-cyan);
		color: var(--bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-primary);
		font-weight: 700;
		box-shadow: 0 0 10px var(--accent-cyan);
	}

	.step-content {
		flex: 1;
	}

	.step-title {
		font-family: var(--font-primary);
		font-size: 1rem;
		color: var(--text-primary);
		margin: 0 0 0.25rem;
	}

	.step-desc {
		font-family: var(--font-secondary);
		font-size: 0.875rem;
		color: var(--text-muted);
		margin: 0 0 1rem;
	}

	.file-upload {
		border: 2px dashed var(--border-color);
		border-radius: 4px;
		padding: 2rem;
		text-align: center;
		transition: all 0.2s ease;
	}

	.file-upload:hover {
		border-color: var(--accent-cyan);
		background: rgba(0, 255, 255, 0.05);
	}

	.upload-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.upload-icon {
		font-size: 3rem;
	}

	.upload-text {
		font-family: var(--font-secondary);
		color: var(--text-secondary);
	}

	.editor-controls {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.waveform-placeholder {
		height: 100px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-text {
		font-family: var(--font-secondary);
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.enemy-types {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.enemy-type-btn {
		padding: 0.5rem 1rem;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		font-family: var(--font-primary);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.enemy-type-btn:hover {
		border-color: var(--accent-cyan);
		color: var(--accent-cyan);
	}

	.enemy-type-btn.scout:hover {
		border-color: var(--accent-green);
		color: var(--accent-green);
	}

	.enemy-type-btn.fighter:hover {
		border-color: var(--accent-yellow);
		color: var(--accent-yellow);
	}

	.enemy-type-btn.cruiser:hover {
		border-color: var(--accent-orange);
		color: var(--accent-orange);
	}

	.enemy-type-btn.boss:hover {
		border-color: var(--accent-red);
		color: var(--accent-red);
	}

	.level-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-family: var(--font-primary);
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.form-input,
	.form-select,
	.form-textarea {
		padding: 0.75rem 1rem;
		background: var(--bg-tertiary);
		border: 2px solid var(--border-color);
		color: var(--text-primary);
		font-family: var(--font-secondary);
		font-size: 1rem;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.form-input:focus,
	.form-select:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--accent-cyan);
		box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
	}

	.form-input:disabled,
	.form-select:disabled,
	.form-textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.form-textarea {
		min-height: 80px;
		resize: vertical;
	}

	.form-select {
		cursor: pointer;
	}

	@media (max-width: 768px) {
		.menu-content {
			gap: 2rem;
			padding: 1rem;
		}

		.menu-buttons {
			max-width: 100%;
		}

		.setting-item {
			flex-direction: column;
			align-items: stretch;
		}

		.setting-control {
			max-width: 100%;
		}

		.select-control {
			justify-content: flex-start;
		}

		.level-item {
			flex-direction: column;
			align-items: stretch;
		}

		.level-actions {
			width: 100%;
		}

		.level-actions :global(button) {
			width: 100%;
		}

		.editor-step {
			flex-direction: column;
		}
	}
</style>
