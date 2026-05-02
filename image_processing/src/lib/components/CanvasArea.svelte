<script lang="ts">
	import { editor, isProcessing, toastMessage } from '../stores';
	import { imageProcessor } from '../imageProcessor';
	import { AddLayerCommand } from '../commands';
	import type { Layer } from '../types';
	import { onMount } from 'svelte';

	let canvasContainer: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	$: layers = $editor.layers;
	$: canvasWidth = $editor.canvasWidth;
	$: canvasHeight = $editor.canvasHeight;
	$: zoom = $editor.zoom;

	let isDragging = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let offsetX = 0;
	let offsetY = 0;

	let isDragOver = false;

	onMount(() => {
		imageProcessor.initWasm().catch((e) => {
			console.warn('WASM initialization failed:', e);
		});
	});

	function renderCanvas() {
		if (!ctx) return;

		const containerWidth = canvasContainer.clientWidth;
		const containerHeight = canvasContainer.clientHeight;

		canvas.width = containerWidth;
		canvas.height = containerHeight;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#1a1a1a';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const scaledWidth = canvasWidth * zoom;
		const scaledHeight = canvasHeight * zoom;

		const centerX = canvas.width / 2 + offsetX;
		const centerY = canvas.height / 2 + offsetY;

		const drawX = centerX - scaledWidth / 2;
		const drawY = centerY - scaledHeight / 2;

		drawCheckerboard(ctx, drawX, drawY, scaledWidth, scaledHeight);

		for (const layer of layers) {
			if (!layer.visible) continue;
			if (!layer.imageData) continue;

			const tempCanvas = document.createElement('canvas');
			tempCanvas.width = layer.width;
			tempCanvas.height = layer.height;
			const tempCtx = tempCanvas.getContext('2d');
			if (!tempCtx) continue;

			tempCtx.putImageData(layer.imageData, 0, 0);

			ctx.save();
			ctx.globalAlpha = layer.opacity;
			ctx.drawImage(
				tempCanvas,
				drawX + layer.x * zoom,
				drawY + layer.y * zoom,
				scaledWidth,
				scaledHeight
			);
			ctx.restore();
		}
	}

	function drawCheckerboard(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		w: number,
		h: number
	) {
		const size = Math.max(8 * zoom, 8);
		const light = '#333';
		const dark = '#2a2a2a';

		for (let row = 0; row * size < h; row++) {
			for (let col = 0; col * size < w; col++) {
				ctx.fillStyle = (row + col) % 2 === 0 ? light : dark;
				ctx.fillRect(
					x + col * size,
					y + row * size,
					Math.min(size, w - col * size),
					Math.min(size, h - row * size)
				);
			}
		}
	}

	$: renderCanvas();

	function handleMouseDown(e: MouseEvent) {
		if (e.button === 1 || (e.button === 0 && e.altKey)) {
			isDragging = true;
			dragStartX = e.clientX - offsetX;
			dragStartY = e.clientY - offsetY;
			canvas.style.cursor = 'grabbing';
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDragging) {
			offsetX = e.clientX - dragStartX;
			offsetY = e.clientY - dragStartY;
		}
	}

	function handleMouseUp() {
		isDragging = false;
		canvas.style.cursor = 'grab';
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 0.9 : 1.1;
		const newZoom = Math.max(0.1, Math.min(10, zoom * delta));
		editor.setZoom(newZoom);
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;

		const files = e.dataTransfer?.files;
		if (!files || files.length === 0) return;

		const imageFiles = Array.from(files).filter((file) =>
			file.type.startsWith('image/')
		);

		if (imageFiles.length === 0) {
			showToast('请拖放图片文件', 'error');
			return;
		}

		try {
			for (const file of imageFiles) {
				const imageData = await imageProcessor.fileToImageData(file);

				if (layers.length === 0) {
					editor.setCanvasSize(imageData.width, imageData.height);
				}

				const layer: Layer = {
					id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					name: file.name.replace(/\.[^/.]+$/, ''),
					visible: true,
					opacity: 1,
					blendMode: 'normal',
					width: imageData.width,
					height: imageData.height,
					x: 0,
					y: 0,
					imageData
				};

				const command = new AddLayerCommand(layer);
				await editor.execute(command);
			}

			showToast(`已导入 ${imageFiles.length} 张图片`, 'success');
		} catch (e) {
			showToast('导入图片失败', 'error');
			console.error(e);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function showToast(message: string, type: 'success' | 'error' | 'info') {
		$toastMessage = { message, type };
		setTimeout(() => {
			$toastMessage = null;
		}, 3000);
	}
</script>

<div
	class="canvas-container"
	bind:this={canvasContainer}
	class:drag-over={isDragOver}
	on:drop={handleDrop}
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
>
	<canvas
		bind:this={canvas}
		class="canvas"
		style="cursor: grab;"
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMove}
		on:mouseup={handleMouseUp}
		on:mouseleave={handleMouseUp}
		on:wheel={handleWheel}
	/>

	{#if layers.length === 0}
		<div class="empty-hint">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
				<circle cx="8.5" cy="8.5" r="1.5" />
				<polyline points="21 15 16 10 5 21" />
			</svg>
			<p>拖放图片到这里开始编辑</p>
			<p class="hint">或使用顶部工具栏的"打开"按钮</p>
		</div>
	{/if}

	<div class="zoom-indicator">
		<button class="zoom-btn" onclick={() => editor.setZoom(zoom * 0.9)} title="缩小">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</button>
		<span class="zoom-value">{Math.round(zoom * 100)}%</span>
		<button class="zoom-btn" onclick={() => editor.setZoom(zoom * 1.1)} title="放大">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</button>
	</div>
</div>

<style>
	.canvas-container {
		position: relative;
		flex: 1;
		overflow: hidden;
		background: #1a1a1a;
		transition: background 0.2s ease;
	}

	.canvas-container.drag-over {
		background: #1a2a3a;
	}

	.canvas-container.drag-over::before {
		content: '';
		position: absolute;
		inset: 8px;
		border: 2px dashed #4a8fd2;
		border-radius: 8px;
		pointer-events: none;
		z-index: 10;
	}

	.canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.empty-hint {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: #555;
		pointer-events: none;
	}

	.empty-hint svg {
		color: #444;
		margin-bottom: 16px;
	}

	.empty-hint p {
		margin: 0 0 8px 0;
		font-size: 14px;
	}

	.empty-hint .hint {
		font-size: 12px;
		color: #444;
	}

	.zoom-indicator {
		position: absolute;
		bottom: 16px;
		right: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid #333;
		border-radius: 6px;
		padding: 6px 10px;
	}

	.zoom-btn {
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
		border-radius: 3px;
		transition: all 0.15s ease;
	}

	.zoom-btn:hover {
		background: #333;
		color: #ccc;
	}

	.zoom-value {
		font-size: 12px;
		color: #aaa;
		font-family: 'SF Mono', monospace;
		min-width: 50px;
		text-align: center;
	}
</style>
