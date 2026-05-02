import { writable, derived, type Readable, type Writable } from 'svelte/store';
import type { Layer, EditorState, Command, ColorAdjustments, FilterConfig } from './types';

function createInitialState(): EditorState {
	return {
		layers: [],
		activeLayerId: null,
		canvasWidth: 800,
		canvasHeight: 600,
		zoom: 1,
		historyIndex: -1,
		maxHistory: 50
	};
}

function createEditorStore() {
	const { subscribe, set, update } = writable<EditorState>(createInitialState());
	const history: Writable<Command[]> = writable([]);
	const redoStack: Writable<Command[]> = writable([]);

	async function execute(command: Command) {
		await command.forward();
		update(($state) => {
			return { ...$state, historyIndex: $state.historyIndex + 1 };
		});
		history.update(($history) => {
			const newHistory = [...$history.slice(0, getCurrentHistoryIndex() + 1), command];
			return newHistory.slice(-getMaxHistory());
		});
		redoStack.set([]);
	}

	async function undo() {
		let currentHistory: Command[] = [];
		history.subscribe(($history) => {
			currentHistory = $history;
		})();

		let $state: EditorState = createInitialState();
		subscribe(($s) => {
			$state = $s;
		})();

		if ($state.historyIndex >= 0 && $state.historyIndex < currentHistory.length) {
			const command = currentHistory[$state.historyIndex];
			await command.backward();
			redoStack.update(($redo) => [command, ...$redo]);
			update(($s) => ({ ...$s, historyIndex: $s.historyIndex - 1 }));
		}
	}

	async function redo() {
		let currentRedo: Command[] = [];
		redoStack.subscribe(($redo) => {
			currentRedo = $redo;
		})();

		if (currentRedo.length > 0) {
			const command = currentRedo[0];
			await command.forward();
			history.update(($history) => [...$history, command]);
			redoStack.update(($redo) => $redo.slice(1));
			update(($s) => ({ ...$s, historyIndex: $s.historyIndex + 1 }));
		}
	}

	function getCurrentHistoryIndex(): number {
		let index = -1;
		subscribe(($state) => {
			index = $state.historyIndex;
		})();
		return index;
	}

	function getMaxHistory(): number {
		let max = 50;
		subscribe(($state) => {
			max = $state.maxHistory;
		})();
		return max;
	}

	function addLayer(layer: Layer) {
		update(($state) => {
			const newLayers = [...$state.layers, layer];
			return {
				...$state,
				layers: newLayers,
				activeLayerId: layer.id
			};
		});
	}

	function removeLayer(layerId: string) {
		update(($state) => {
			const newLayers = $state.layers.filter((l) => l.id !== layerId);
			const newActiveId =
				$state.activeLayerId === layerId
					? newLayers.length > 0
						? newLayers[newLayers.length - 1].id
						: null
					: $state.activeLayerId;
			return {
				...$state,
				layers: newLayers,
				activeLayerId: newActiveId
			};
		});
	}

	function updateLayer(layerId: string, updates: Partial<Layer>) {
		update(($state) => ({
			...$state,
			layers: $state.layers.map((layer) =>
				layer.id === layerId ? { ...layer, ...updates } : layer
			)
		}));
	}

	function moveLayer(fromIndex: number, toIndex: number) {
		update(($state) => {
			const newLayers = [...$state.layers];
			const [layer] = newLayers.splice(fromIndex, 1);
			newLayers.splice(toIndex, 0, layer);
			return { ...$state, layers: newLayers };
		});
	}

	function setActiveLayer(layerId: string | null) {
		update(($state) => ({ ...$state, activeLayerId: layerId }));
	}

	function setZoom(zoom: number) {
		update(($state) => ({ ...$state, zoom: Math.max(0.1, Math.min(10, zoom)) }));
	}

	function setCanvasSize(width: number, height: number) {
		update(($state) => ({ ...$state, canvasWidth: width, canvasHeight: height }));
	}

	function reset() {
		set(createInitialState());
		history.set([]);
		redoStack.set([]);
	}

	const canUndo = derived<[typeof history, Readable<EditorState>], boolean>(
		[history, { subscribe }],
		([$history, $state]) => $state.historyIndex >= 0 && $history.length > 0
	);

	const canRedo = derived(redoStack, ($redo) => $redo.length > 0);

	const activeLayer = derived<
		[Readable<Layer[]>, Readable<string | null>],
		Layer | undefined
	>(
		[
			{ subscribe: (fn) => subscribe(($s) => fn($s.layers)) },
			{ subscribe: (fn) => subscribe(($s) => fn($s.activeLayerId)) }
		],
		([$layers, $activeId]) => $layers.find((l) => l.id === $activeId)
	);

	return {
		subscribe,
		set,
		update,
		execute,
		undo,
		redo,
		addLayer,
		removeLayer,
		updateLayer,
		moveLayer,
		setActiveLayer,
		setZoom,
		setCanvasSize,
		reset,
		canUndo,
		canRedo,
		activeLayer
	};
}

export const editor = createEditorStore();

export const colorAdjustments = writable<ColorAdjustments>({
	brightness: 0,
	contrast: 0,
	saturation: 1,
	hue: 0
});

export const filterConfig = writable<FilterConfig>({
	type: 'grayscale',
	intensity: 1,
	radius: 3
});

export const isProcessing = writable<boolean>(false);

export const toastMessage = writable<{ message: string; type: 'success' | 'error' | 'info' } | null>(
	null
);
