import type { Layer, Command, ColorAdjustments, FilterConfig, BlendMode } from './types';
import { editor } from './stores';

export class AddLayerCommand implements Command {
	id: string;
	type: 'add_layer';
	payload: { layer: Layer };
	private layer: Layer;

	constructor(layer: Layer) {
		this.id = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.type = 'add_layer';
		this.layer = layer;
		this.payload = { layer };
	}

	async forward(): Promise<void> {
		editor.addLayer(this.layer);
	}

	async backward(): Promise<void> {
		editor.removeLayer(this.layer.id);
	}
}

export class RemoveLayerCommand implements Command {
	id: string;
	type: 'remove_layer';
	payload: { layerId: string; index: number };
	private layer: Layer;
	private index: number;

	constructor(layer: Layer, index: number) {
		this.id = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.type = 'remove_layer';
		this.layer = { ...layer };
		this.index = index;
		this.payload = { layerId: layer.id, index };
	}

	async forward(): Promise<void> {
		editor.removeLayer(this.layer.id);
	}

	async backward(): Promise<void> {
		editor.addLayer(this.layer);
		let layers: Layer[] = [];
		editor.subscribe(($state) => {
			layers = $state.layers;
		})();
		const currentIndex = layers.findIndex((l) => l.id === this.layer.id);
		if (currentIndex !== -1 && currentIndex !== this.index) {
			editor.moveLayer(currentIndex, this.index);
		}
	}
}

export class MoveLayerCommand implements Command {
	id: string;
	type: 'move_layer';
	payload: { fromIndex: number; toIndex: number };
	private fromIndex: number;
	private toIndex: number;

	constructor(fromIndex: number, toIndex: number) {
		this.id = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.type = 'move_layer';
		this.fromIndex = fromIndex;
		this.toIndex = toIndex;
		this.payload = { fromIndex, toIndex };
	}

	async forward(): Promise<void> {
		editor.moveLayer(this.fromIndex, this.toIndex);
	}

	async backward(): Promise<void> {
		editor.moveLayer(this.toIndex, this.fromIndex);
	}
}

export class UpdateLayerCommand implements Command {
	id: string;
	type: 'update_layer';
	payload: { layerId: string; updates: Partial<Layer> };
	private layerId: string;
	private oldState: Partial<Layer>;
	private newState: Partial<Layer>;

	constructor(layerId: string, oldState: Partial<Layer>, newState: Partial<Layer>) {
		this.id = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.type = 'update_layer';
		this.layerId = layerId;
		this.oldState = { ...oldState };
		this.newState = { ...newState };
		this.payload = { layerId, updates: newState };
	}

	async forward(): Promise<void> {
		editor.updateLayer(this.layerId, this.newState);
	}

	async backward(): Promise<void> {
		editor.updateLayer(this.layerId, this.oldState);
	}
}

export class AdjustColorCommand implements Command {
	id: string;
	type: 'adjust_color';
	payload: { layerId: string; adjustments: ColorAdjustments };
	private layerId: string;
	private oldImageData: ImageData | null;
	private newImageData: ImageData | null;
	private processor: (imageData: ImageData, adjustments: ColorAdjustments) => Promise<ImageData>;
	private adjustments: ColorAdjustments;

	constructor(
		layerId: string,
		adjustments: ColorAdjustments,
		processor: (imageData: ImageData, adjustments: ColorAdjustments) => Promise<ImageData>
	) {
		this.id = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.type = 'adjust_color';
		this.layerId = layerId;
		this.adjustments = adjustments;
		this.processor = processor;
		this.oldImageData = null;
		this.newImageData = null;
		this.payload = { layerId, adjustments };
	}

	async forward(): Promise<void> {
		let layer: Layer | undefined;
		editor.subscribe(($state) => {
			layer = $state.layers.find((l) => l.id === this.layerId);
		})();

		if (!layer?.imageData) return;

		this.oldImageData = new ImageData(
			new Uint8ClampedArray(layer.imageData.data),
			layer.imageData.width,
			layer.imageData.height
		);

		this.newImageData = await this.processor(layer.imageData, this.adjustments);
		editor.updateLayer(this.layerId, { imageData: this.newImageData });
	}

	async backward(): Promise<void> {
		if (this.oldImageData) {
			editor.updateLayer(this.layerId, { imageData: this.oldImageData });
		}
	}
}

export class ApplyFilterCommand implements Command {
	id: string;
	type: 'apply_filter';
	payload: { layerId: string; config: FilterConfig };
	private layerId: string;
	private oldImageData: ImageData | null;
	private newImageData: ImageData | null;
	private processor: (imageData: ImageData, config: FilterConfig) => Promise<ImageData>;
	private config: FilterConfig;

	constructor(
		layerId: string,
		config: FilterConfig,
		processor: (imageData: ImageData, config: FilterConfig) => Promise<ImageData>
	) {
		this.id = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.type = 'apply_filter';
		this.layerId = layerId;
		this.config = config;
		this.processor = processor;
		this.oldImageData = null;
		this.newImageData = null;
		this.payload = { layerId, config };
	}

	async forward(): Promise<void> {
		let layer: Layer | undefined;
		editor.subscribe(($state) => {
			layer = $state.layers.find((l) => l.id === this.layerId);
		})();

		if (!layer?.imageData) return;

		this.oldImageData = new ImageData(
			new Uint8ClampedArray(layer.imageData.data),
			layer.imageData.width,
			layer.imageData.height
		);

		this.newImageData = await this.processor(layer.imageData, this.config);
		editor.updateLayer(this.layerId, { imageData: this.newImageData });
	}

	async backward(): Promise<void> {
		if (this.oldImageData) {
			editor.updateLayer(this.layerId, { imageData: this.oldImageData });
		}
	}
}

export class TransformLayerCommand implements Command {
	id: string;
	type: 'transform_layer';
	payload: { layerId: string; x: number; y: number; width: number; height: number };
	private layerId: string;
	private oldTransform: { x: number; y: number; width: number; height: number };
	private newTransform: { x: number; y: number; width: number; height: number };

	constructor(
		layerId: string,
		oldTransform: { x: number; y: number; width: number; height: number },
		newTransform: { x: number; y: number; width: number; height: number }
	) {
		this.id = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		this.type = 'transform_layer';
		this.layerId = layerId;
		this.oldTransform = { ...oldTransform };
		this.newTransform = { ...newTransform };
		this.payload = { layerId, ...newTransform };
	}

	async forward(): Promise<void> {
		editor.updateLayer(this.layerId, this.newTransform);
	}

	async backward(): Promise<void> {
		editor.updateLayer(this.layerId, this.oldTransform);
	}
}

export function createCommand<T extends Command>(
	type: T['type'],
	...args: ConstructorParameters<new (...args: unknown[]) => T>
): T {
	const constructors: Record<string, new (...args: unknown[]) => Command> = {
		add_layer: AddLayerCommand,
		remove_layer: RemoveLayerCommand,
		move_layer: MoveLayerCommand,
		update_layer: UpdateLayerCommand,
		adjust_color: AdjustColorCommand,
		apply_filter: ApplyFilterCommand,
		transform_layer: TransformLayerCommand
	};

	const Constructor = constructors[type];
	if (!Constructor) {
		throw new Error(`Unknown command type: ${type}`);
	}

	return new Constructor(...args) as T;
}
