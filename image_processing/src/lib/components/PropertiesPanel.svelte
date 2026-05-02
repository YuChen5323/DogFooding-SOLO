<script lang="ts">
	import { editor, colorAdjustments, filterConfig, isProcessing, toastMessage } from '../stores';
	import { imageProcessor } from '../imageProcessor';
	import { AdjustColorCommand, ApplyFilterCommand } from '../commands';
	import type { ColorAdjustments, FilterConfig, FilterType } from '../types';

	$: activeLayer = $editor.activeLayer;
	$: adjustments = $colorAdjustments;
	$: filter = $filterConfig;

	const filterTypes: { type: FilterType; label: string }[] = [
		{ type: 'grayscale', label: '灰度' },
		{ type: 'invert', label: '反转' },
		{ type: 'sepia', label: '复古' },
		{ type: 'gaussian_blur', label: '高斯模糊' },
		{ type: 'sharpen', label: '锐化' }
	];

	async function applyColorAdjustment() {
		if (!activeLayer?.imageData) {
			showToast('请先选择一个有图像的图层', 'error');
			return;
		}

		$isProcessing = true;
		try {
			const command = new AdjustColorCommand(
				activeLayer.id,
				adjustments,
				(imageData, adj) => imageProcessor.adjustColor(imageData, adj)
			);
			await editor.execute(command);
			showToast('色彩调整已应用', 'success');
		} catch (e) {
			showToast('应用色彩调整失败', 'error');
			console.error(e);
		} finally {
			$isProcessing = false;
		}
	}

	async function applyFilter() {
		if (!activeLayer?.imageData) {
			showToast('请先选择一个有图像的图层', 'error');
			return;
		}

		$isProcessing = true;
		try {
			const command = new ApplyFilterCommand(
				activeLayer.id,
				filter,
				(imageData, config) => imageProcessor.applyFilter(imageData, config)
			);
			await editor.execute(command);
			showToast('滤镜已应用', 'success');
		} catch (e) {
			showToast('应用滤镜失败', 'error');
			console.error(e);
		} finally {
			$isProcessing = false;
		}
	}

	function resetAdjustments() {
		colorAdjustments.set({
			brightness: 0,
			contrast: 0,
			saturation: 1,
			hue: 0
		});
	}

	function showToast(message: string, type: 'success' | 'error' | 'info') {
		$toastMessage = { message, type };
		setTimeout(() => {
			$toastMessage = null;
		}, 3000);
	}
</script>

<div class="properties-panel">
	<div class="panel-section">
		<div class="section-header">
			<h4>色彩调整</h4>
			<button class="reset-btn" onclick={resetAdjustment} title="重置">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
					<path d="M3 3v5h5" />
				</svg>
			</button>
		</div>

		<div class="slider-group">
			<div class="slider-row">
				<label class="slider-label">
					<span>亮度</span>
					<span class="slider-value">{Math.round(adjustments.brightness * 100)}%</span>
				</label>
				<input
					type="range"
					class="slider"
					min="-1"
					max="1"
					step="0.01"
					bind:value={adjustments.brightness}
					disabled={!activeLayer || $isProcessing}
				/>
			</div>

			<div class="slider-row">
				<label class="slider-label">
					<span>对比度</span>
					<span class="slider-value">{Math.round(adjustments.contrast * 100)}%</span>
				</label>
				<input
					type="range"
					class="slider"
					min="-1"
					max="1"
					step="0.01"
					bind:value={adjustments.contrast}
					disabled={!activeLayer || $isProcessing}
				/>
			</div>

			<div class="slider-row">
				<label class="slider-label">
					<span>饱和度</span>
					<span class="slider-value">{Math.round(adjustments.saturation * 100)}%</span>
				</label>
				<input
					type="range"
					class="slider"
					min="0"
					max="2"
					step="0.01"
					bind:value={adjustments.saturation}
					disabled={!activeLayer || $isProcessing}
				/>
			</div>

			<div class="slider-row">
				<label class="slider-label">
					<span>色相</span>
					<span class="slider-value">{Math.round(adjustments.hue)}°</span>
				</label>
				<input
					type="range"
					class="slider"
					min="-180"
					max="180"
					step="1"
					bind:value={adjustments.hue}
					disabled={!activeLayer || $isProcessing}
				/>
			</div>
		</div>

		<button
			class="apply-btn"
			onclick={applyColorAdjustment}
			disabled={!activeLayer || $isProcessing}
		>
			{#if $isProcessing}
				<span class="spinner" />
			{/if}
			应用调整
		</button>
	</div>

	<div class="panel-section">
		<div class="section-header">
			<h4>滤镜</h4>
		</div>

		<div class="filter-group">
			<select
				class="filter-select"
				bind:value={filter.type}
				disabled={$isProcessing}
			>
				{#each filterTypes as ft}
					<option value={ft.type}>{ft.label}</option>
				{/each}
			</select>

			{#if filter.type === 'gaussian_blur'}
				<div class="slider-row">
					<label class="slider-label">
						<span>模糊半径</span>
						<span class="slider-value">{filter.radius ?? 3}px</span>
					</label>
					<input
						type="range"
						class="slider"
						min="1"
						max="20"
						step="1"
						bind:value={filter.radius}
						disabled={$isProcessing}
					/>
				</div>
			{/if}

			{#if filter.type === 'sharpen'}
				<div class="slider-row">
					<label class="slider-label">
						<span>锐化强度</span>
						<span class="slider-value">{(filter.intensity ?? 1).toFixed(1)}</span>
					</label>
					<input
						type="range"
						class="slider"
						min="0.1"
						max="3"
						step="0.1"
						bind:value={filter.intensity}
						disabled={$isProcessing}
					/>
				</div>
			{/if}
		</div>

		<button
			class="apply-btn"
			onclick={applyFilter}
			disabled={!activeLayer || $isProcessing}
		>
			{#if $isProcessing}
				<span class="spinner" />
			{/if}
			应用滤镜
		</button>
	</div>

	{#if activeLayer}
		<div class="panel-section">
			<div class="section-header">
				<h4>图层信息</h4>
			</div>
			<div class="layer-info-grid">
				<div class="info-item">
					<span class="info-label">位置</span>
					<span class="info-value">({activeLayer.x}, {activeLayer.y})</span>
				</div>
				<div class="info-item">
					<span class="info-label">尺寸</span>
					<span class="info-value">{activeLayer.width} × {activeLayer.height}</span>
				</div>
				<div class="info-item">
					<span class="info-label">不透明度</span>
					<span class="info-value">{Math.round(activeLayer.opacity * 100)}%</span>
				</div>
				<div class="info-item">
					<span class="info-label">混合模式</span>
					<span class="info-value">{activeLayer.blendMode}</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.properties-panel {
		width: 260px;
		background: #1e1e1e;
		border-right: 1px solid #333;
		height: 100%;
		overflow-y: auto;
		padding: 12px;
	}

	.panel-section {
		margin-bottom: 20px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.section-header h4 {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: #e0e0e0;
	}

	.reset-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: transparent;
		border: none;
		color: #888;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s ease;
	}

	.reset-btn:hover {
		color: #ccc;
	}

	.slider-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 16px;
	}

	.slider-row {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.slider-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
		color: #aaa;
	}

	.slider-value {
		font-size: 11px;
		color: #666;
		font-family: 'SF Mono', monospace;
	}

	.slider {
		width: 100%;
		height: 4px;
		background: #333;
		border-radius: 2px;
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
	}

	.slider:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		background: #666;
		border-radius: 50%;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.slider::-webkit-slider-thumb:hover {
		background: #888;
	}

	.apply-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 16px;
		background: #4a8fd2;
		border: none;
		border-radius: 4px;
		color: #fff;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.apply-btn:hover:not(:disabled) {
		background: #5a9fe2;
	}

	.apply-btn:disabled {
		background: #333;
		color: #666;
		cursor: not-allowed;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 16px;
	}

	.filter-select {
		width: 100%;
		padding: 8px 12px;
		background: #252525;
		border: 1px solid #333;
		border-radius: 4px;
		color: #ccc;
		font-size: 13px;
		cursor: pointer;
	}

	.filter-select:hover {
		background: #2d2d2d;
	}

	.filter-select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.layer-info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.info-label {
		font-size: 11px;
		color: #666;
	}

	.info-value {
		font-size: 12px;
		color: #ccc;
		font-family: 'SF Mono', monospace;
	}
</style>
