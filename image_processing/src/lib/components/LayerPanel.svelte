<script lang="ts">
	import { editor } from '../stores';
	import type { Layer, BlendMode } from '../types';
	import { UpdateLayerCommand, MoveLayerCommand, RemoveLayerCommand } from '../commands';

	$: layers = $editor.layers;
	$: activeLayerId = $editor.activeLayerId;

	const blendModes: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay'];
	const blendModeLabels: Record<BlendMode, string> = {
		normal: '正常',
		multiply: '正片叠底',
		screen: '滤色',
		overlay: '叠加'
	};

	let draggedIndex: number | null = null;
	let dragOverIndex: number | null = null;

	function toggleVisibility(layer: Layer) {
		const oldState = { visible: layer.visible };
		const newState = { visible: !layer.visible };
		const command = new UpdateLayerCommand(layer.id, oldState, newState);
		editor.execute(command);
	}

	function setActiveLayer(layerId: string) {
		editor.setActiveLayer(layerId);
	}

	function updateOpacity(layer: Layer, opacity: number) {
		const oldState = { opacity: layer.opacity };
		const newState = { opacity: opacity / 100 };
		const command = new UpdateLayerCommand(layer.id, oldState, newState);
		editor.execute(command);
	}

	function updateBlendMode(layer: Layer, blendMode: BlendMode) {
		const oldState = { blendMode: layer.blendMode };
		const newState = { blendMode };
		const command = new UpdateLayerCommand(layer.id, oldState, newState);
		editor.execute(command);
	}

	function renameLayer(layer: Layer, newName: string) {
		if (newName.trim() && newName !== layer.name) {
			const oldState = { name: layer.name };
			const newState = { name: newName.trim() };
			const command = new UpdateLayerCommand(layer.id, oldState, newState);
			editor.execute(command);
		}
	}

	function deleteLayer(layer: Layer, index: number) {
		const command = new RemoveLayerCommand(layer, index);
		editor.execute(command);
	}

	function handleDragStart(index: number) {
		draggedIndex = index;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverIndex = index;
	}

	function handleDrop(index: number) {
		if (draggedIndex !== null && draggedIndex !== index) {
			const command = new MoveLayerCommand(draggedIndex, index);
			editor.execute(command);
		}
		draggedIndex = null;
		dragOverIndex = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
		dragOverIndex = null;
	}

	function addLayer() {
		const newLayer: Layer = {
			id: `layer-${Date.now()}`,
			name: `图层 ${layers.length + 1}`,
			visible: true,
			opacity: 1,
			blendMode: 'normal',
			width: $editor.canvasWidth,
			height: $editor.canvasHeight,
			x: 0,
			y: 0
		};
		editor.addLayer(newLayer);
	}
</script>

<div class="layer-panel">
	<div class="panel-header">
		<h3>图层</h3>
		<button class="add-btn" title="添加图层" onclick={addLayer}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</button>
	</div>

	<div class="layer-list">
		{#each [...layers].reverse() as layer, i}
			{@const originalIndex = layers.length - 1 - i}
			{@const isActive = layer.id === activeLayerId}
			{@const isDragOver = dragOverIndex === originalIndex}
			{@const isDragging = draggedIndex === originalIndex}

			<div
				class="layer-item"
				class:active={isActive}
				class:drag-over={isDragOver}
				class:dragging={isDragging}
				draggable={true}
				on:dragstart={() => handleDragStart(originalIndex)}
				on:dragover={(e) => handleDragOver(e, originalIndex)}
				on:drop={() => handleDrop(originalIndex)}
				on:dragend={handleDragEnd}
				on:click={() => setActiveLayer(layer.id)}
			>
				<button
					class="visibility-btn"
					title={layer.visible ? '隐藏图层' : '显示图层'}
					on:click|stopPropagation={() => toggleVisibility(layer)}
				>
					{#if layer.visible}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					{:else}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
							<line x1="1" y1="1" x2="23" y2="23" />
						</svg>
					{/if}
				</button>

				<div class="layer-thumbnail">
					{#if layer.imageData}
						<canvas
							width={32}
							height={32}
							use:renderThumbnail={layer.imageData}
						/>
					{:else}
						<div class="empty-thumbnail" />
					{/if}
				</div>

				<div class="layer-info">
					<input
						type="text"
						class="layer-name"
						value={layer.name}
						on:change={(e) => renameLayer(layer, e.target.value)}
						on:click|stopPropagation
					/>
					<select
						class="blend-mode-select"
						value={layer.blendMode}
						on:change={(e) => updateBlendMode(layer, e.target.value as BlendMode)}
						on:click|stopPropagation
					>
						{#each blendModes as mode}
							<option value={mode}>{blendModeLabels[mode]}</option>
						{/each}
					</select>
				</div>

				<div class="layer-controls">
					<input
						type="range"
						class="opacity-slider"
						min="0"
						max="100"
						value={layer.opacity * 100}
						title={`不透明度: ${Math.round(layer.opacity * 100)}%`}
						on:input={(e) => updateOpacity(layer, parseFloat(e.target.value))}
						on:click|stopPropagation
					/>
					<button
						class="delete-btn"
						title="删除图层"
						on:click|stopPropagation={() => deleteLayer(layer, originalIndex)}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="3 6 5 6 21 6" />
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
						</svg>
					</button>
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<p>暂无图层</p>
				<p class="hint">拖拽图片或点击 + 添加图层</p>
			</div>
		{/each}
	</div>
</div>

<script lang="ts">
	import { tick } from 'svelte';

	function renderThumbnail(node: HTMLCanvasElement, imageData: ImageData) {
		const ctx = node.getContext('2d');
		if (!ctx) return;

		const scale = Math.min(32 / imageData.width, 32 / imageData.height);
		const w = imageData.width * scale;
		const h = imageData.height * scale;

		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = imageData.width;
		tempCanvas.height = imageData.height;
		const tempCtx = tempCanvas.getContext('2d');
		if (tempCtx) {
			tempCtx.putImageData(imageData, 0, 0);
			ctx.drawImage(tempCanvas, 0, 0, w, h);
		}
	}
</script>

<style>
	.layer-panel {
		display: flex;
		flex-direction: column;
		width: 280px;
		background: #1e1e1e;
		border-left: 1px solid #333;
		height: 100%;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid #333;
		background: #252525;
	}

	.panel-header h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: #e0e0e0;
	}

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: #333;
		border: none;
		border-radius: 4px;
		color: #ccc;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.add-btn:hover {
		background: #444;
		color: #fff;
	}

	.layer-list {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px;
		background: #252525;
		border: 1px solid #333;
		border-radius: 6px;
		margin-bottom: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.layer-item:hover {
		background: #2d2d2d;
		border-color: #444;
	}

	.layer-item.active {
		background: #2a3a52;
		border-color: #4a8fd2;
	}

	.layer-item.drag-over {
		border-top: 2px solid #4a8fd2;
	}

	.layer-item.dragging {
		opacity: 0.5;
	}

	.visibility-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: transparent;
		border: none;
		color: #888;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s ease;
	}

	.visibility-btn:hover {
		color: #ccc;
	}

	.layer-thumbnail {
		width: 32px;
		height: 32px;
		background: repeating-conic-gradient(#555 0% 25%, #444 0% 50%) 50% / 8px 8px;
		border-radius: 4px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.layer-thumbnail canvas {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.empty-thumbnail {
		width: 100%;
		height: 100%;
		background: #333;
	}

	.layer-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.layer-name {
		width: 100%;
		background: transparent;
		border: none;
		color: #e0e0e0;
		font-size: 13px;
		padding: 0;
		outline: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.layer-name:focus {
		background: #333;
		border-radius: 2px;
		padding: 2px 4px;
		margin: -2px -4px;
	}

	.blend-mode-select {
		width: fit-content;
		background: #333;
		border: 1px solid #444;
		border-radius: 3px;
		color: #ccc;
		font-size: 11px;
		padding: 2px 6px;
		cursor: pointer;
	}

	.blend-mode-select:hover {
		background: #3a3a3a;
	}

	.layer-controls {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.opacity-slider {
		width: 60px;
		height: 4px;
		background: #444;
		border-radius: 2px;
		-webkit-appearance: none;
		appearance: none;
		cursor: pointer;
	}

	.opacity-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		background: #666;
		border-radius: 50%;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.opacity-slider::-webkit-slider-thumb:hover {
		background: #888;
	}

	.delete-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: transparent;
		border: none;
		color: #666;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s ease;
	}

	.delete-btn:hover {
		color: #e57373;
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: #666;
	}

	.empty-state p {
		margin: 0 0 8px 0;
		font-size: 13px;
	}

	.empty-state .hint {
		font-size: 11px;
		color: #555;
	}
</style>
