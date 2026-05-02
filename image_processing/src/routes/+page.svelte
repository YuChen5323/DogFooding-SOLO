<script lang="ts">
	import Toolbar from '$lib/components/Toolbar.svelte';
	import PropertiesPanel from '$lib/components/PropertiesPanel.svelte';
	import LayerPanel from '$lib/components/LayerPanel.svelte';
	import CanvasArea from '$lib/components/CanvasArea.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { isProcessing } from '$lib/stores';
</script>

<div class="app">
	<Toolbar />

	<div class="main-content">
		<PropertiesPanel />
		<CanvasArea />
		<LayerPanel />
	</div>

	{#if $isProcessing}
		<div class="processing-overlay">
			<div class="spinner" />
			<span>处理中...</span>
		</div>
	{/if}

	<Toast />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
		background: #1a1a1a;
		overflow: hidden;
	}

	.main-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.processing-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(74, 143, 210, 0.3);
		border-top-color: #4a8fd2;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.processing-overlay span {
		color: #ccc;
		font-size: 14px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
