export interface Layer {
	id: string;
	name: string;
	visible: boolean;
	opacity: number;
	blendMode: BlendMode;
	width: number;
	height: number;
	x: number;
	y: number;
	imageData?: ImageData;
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';

export interface Command {
	id: string;
	type: CommandType;
	payload: unknown;
	forward(): Promise<void>;
	backward(): Promise<void>;
}

export type CommandType = 
	| 'add_layer' 
	| 'remove_layer' 
	| 'move_layer'
	| 'update_layer'
	| 'apply_filter'
	| 'adjust_color'
	| 'transform_layer';

export interface ColorAdjustments {
	brightness: number;
	contrast: number;
	saturation: number;
	hue: number;
}

export interface FilterConfig {
	type: FilterType;
	intensity?: number;
	radius?: number;
}

export type FilterType = 
	| 'grayscale' 
	| 'invert' 
	| 'sepia' 
	| 'gaussian_blur' 
	| 'sharpen';

export interface EditorState {
	layers: Layer[];
	activeLayerId: string | null;
	canvasWidth: number;
	canvasHeight: number;
	zoom: number;
	historyIndex: number;
	maxHistory: number;
}

export interface WorkerMessage {
	type: WorkerMessageType;
	payload: unknown;
	id: string;
}

export type WorkerMessageType = 
	| 'init_wasm'
	| 'adjust_color'
	| 'apply_filter'
	| 'blend_layers'
	| 'chroma_key'
	| 'inpaint'
	| 'export_image';

export interface ExportOptions {
	format: 'jpeg' | 'png' | 'webp' | 'avif';
	quality?: number;
}

export interface ImportOptions {
	files: File[];
}
