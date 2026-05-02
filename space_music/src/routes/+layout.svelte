<script lang="ts">
	import { onMount } from 'svelte';
	import { gameState, settings } from '$lib/stores/gameStores';
	import { loadSettings } from '$lib/utils/storage';

	let { children } = $props();

	onMount(() => {
		const savedSettings = loadSettings();
		settings.set(savedSettings);
	});
</script>

<div class="app-container">
	{@render children()}
</div>

<style>
	.app-container {
		width: 100%;
		height: 100vh;
		overflow: hidden;
		position: relative;
	}
</style>
