<script lang="ts">
	import { editor, isProcessing } from '../stores';

	$: $canUndo = $editor.canUndo;
	$: $canRedo = $editor.canRedo;

	function handleUndo() {
		editor.undo();
	}

	function handleRedo() {
		editor.redo();
	}
</script>

<div class="toolbar">
	<div class="toolbar-section">
		<button
			class="toolbar-btn"
			title="撤销 (Ctrl+Z)"
			disabled={!$canUndo || $isProcessing}
			onclick={handleUndo}
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 7v6h6" />
				<path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
			</svg>
			撤销
		</button>
		<button
			class="toolbar-btn"
			title="重做 (Ctrl+Y)"
			disabled={!$canRedo || $isProcessing}
			onclick={handleRedo}
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 7v6h-6" />
				<path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
			</svg>
			重做
		</button>
	</div>

	<div class="toolbar-divider" />

	<div class="toolbar-section">
		<button class="toolbar-btn" title="新建画布" on:click={() => console.log('New')}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 5v14M5 12h14" />
			</svg>
			新建
		</button>
		<button class="toolbar-btn" title="打开文件">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
				<polyline points="13 2 13 9 20 9" />
			</svg>
			打开
		</button>
		<button class="toolbar-btn" title="保存">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
				<polyline points="17 21 17 13 7 13 7 21" />
				<polyline points="7 3 7 8 15 8" />
			</svg>
			保存
		</button>
		<button class="toolbar-btn" title="导出">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="7 10 12 15 17 10" />
				<line x1="12" y1="15" x2="12" y2="3" />
			</svg>
			导出
		</button>
	</div>
</div>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		background: #1e1e1e;
		border-bottom: 1px solid #333;
		min-height: 48px;
	}

	.toolbar-section {
		display: flex;
		gap: 4px;
	}

	.toolbar-divider {
		width: 1px;
		height: 24px;
		background: #333;
		margin: 0 8px;
	}

	.toolbar-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: #ccc;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.toolbar-btn:hover:not(:disabled) {
		background: #2d2d2d;
		color: #fff;
	}

	.toolbar-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
