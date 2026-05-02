import type { ColorAdjustments, FilterConfig, BlendMode, ExportOptions } from './types';

export class ImageProcessor {
	private wasmModule: typeof import('../../wasm/pkg/image_editor_wasm') | null = null;
	private canvas: OffscreenCanvas | null = null;
	private ctx: OffscreenCanvasRenderingContext2D | null = null;

	constructor() {
		this.canvas = new OffscreenCanvas(1, 1);
		this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
	}

	async initWasm(): Promise<void> {
		if (this.wasmModule) return;
		try {
			this.wasmModule = await import('../../wasm/pkg/image_editor_wasm');
			this.wasmModule.init();
		} catch (e) {
			console.warn('WASM module not loaded, using JavaScript fallback:', e);
		}
	}

	async adjustColor(
		imageData: ImageData,
		adjustments: ColorAdjustments
	): Promise<ImageData> {
		if (this.wasmModule) {
			return this.adjustColorWasm(imageData, adjustments);
		}
		return this.adjustColorJs(imageData, adjustments);
	}

	private adjustColorWasm(
		imageData: ImageData,
		adjustments: ColorAdjustments
	): ImageData {
		let result = imageData;
		
		if (adjustments.brightness !== 0) {
			result = this.wasmModule!.adjust_brightness(result, adjustments.brightness);
		}
		if (adjustments.contrast !== 0) {
			result = this.wasmModule!.adjust_contrast(result, adjustments.contrast);
		}
		if (adjustments.saturation !== 1) {
			result = this.wasmModule!.adjust_saturation(result, adjustments.saturation);
		}
		if (adjustments.hue !== 0) {
			result = this.wasmModule!.adjust_hue(result, adjustments.hue);
		}
		
		return result;
	}

	private adjustColorJs(
		imageData: ImageData,
		adjustments: ColorAdjustments
	): ImageData {
		const data = new Uint8ClampedArray(imageData.data);
		
		for (let i = 0; i < data.length; i += 4) {
			let r = data[i] / 255;
			let g = data[i + 1] / 255;
			let b = data[i + 2] / 255;

			if (adjustments.brightness !== 0) {
				r = Math.max(0, Math.min(1, r + adjustments.brightness));
				g = Math.max(0, Math.min(1, g + adjustments.brightness));
				b = Math.max(0, Math.min(1, b + adjustments.brightness));
			}

			if (adjustments.contrast !== 0) {
				const factor = (259 * (adjustments.contrast * 255 + 255)) / (255 * (259 - adjustments.contrast * 255));
				r = Math.max(0, Math.min(1, factor * (r - 0.5) + 0.5));
				g = Math.max(0, Math.min(1, factor * (g - 0.5) + 0.5));
				b = Math.max(0, Math.min(1, factor * (b - 0.5) + 0.5));
			}

			if (adjustments.saturation !== 1) {
				const gray = 0.299 * r + 0.587 * g + 0.114 * b;
				r = Math.max(0, Math.min(1, gray + adjustments.saturation * (r - gray)));
				g = Math.max(0, Math.min(1, gray + adjustments.saturation * (g - gray)));
				b = Math.max(0, Math.min(1, gray + adjustments.saturation * (b - gray)));
			}

			data[i] = Math.round(r * 255);
			data[i + 1] = Math.round(g * 255);
			data[i + 2] = Math.round(b * 255);
		}

		return new ImageData(data, imageData.width, imageData.height);
	}

	async applyFilter(imageData: ImageData, config: FilterConfig): Promise<ImageData> {
		if (this.wasmModule) {
			return this.applyFilterWasm(imageData, config);
		}
		return this.applyFilterJs(imageData, config);
	}

	private applyFilterWasm(imageData: ImageData, config: FilterConfig): ImageData {
		switch (config.type) {
			case 'grayscale':
				return this.wasmModule!.filter_grayscale(imageData);
			case 'invert':
				return this.wasmModule!.filter_invert(imageData);
			case 'sepia':
				return this.wasmModule!.filter_sepia(imageData);
			case 'gaussian_blur':
				return this.wasmModule!.filter_gaussian_blur(imageData, config.radius || 3);
			case 'sharpen':
				return this.wasmModule!.filter_sharpen(imageData, config.intensity || 1);
			default:
				return imageData;
		}
	}

	private applyFilterJs(imageData: ImageData, config: FilterConfig): ImageData {
		const data = new Uint8ClampedArray(imageData.data);

		switch (config.type) {
			case 'grayscale':
				for (let i = 0; i < data.length; i += 4) {
					const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
					data[i] = gray;
					data[i + 1] = gray;
					data[i + 2] = gray;
				}
				break;

			case 'invert':
				for (let i = 0; i < data.length; i += 4) {
					data[i] = 255 - data[i];
					data[i + 1] = 255 - data[i + 1];
					data[i + 2] = 255 - data[i + 2];
				}
				break;

			case 'sepia':
				for (let i = 0; i < data.length; i += 4) {
					const r = data[i];
					const g = data[i + 1];
					const b = data[i + 2];
					data[i] = Math.min(255, Math.round(0.393 * r + 0.769 * g + 0.189 * b));
					data[i + 1] = Math.min(255, Math.round(0.349 * r + 0.686 * g + 0.168 * b));
					data[i + 2] = Math.min(255, Math.round(0.272 * r + 0.534 * g + 0.131 * b));
				}
				break;
		}

		return new ImageData(data, imageData.width, imageData.height);
	}

	async blendLayers(
		baseData: ImageData,
		overlayData: ImageData,
		blendMode: BlendMode,
		opacity: number
	): Promise<ImageData> {
		if (this.wasmModule) {
			return this.blendLayersWasm(baseData, overlayData, blendMode, opacity);
		}
		return this.blendLayersJs(baseData, overlayData, blendMode, opacity);
	}

	private blendLayersWasm(
		baseData: ImageData,
		overlayData: ImageData,
		blendMode: BlendMode,
		opacity: number
	): ImageData {
		switch (blendMode) {
			case 'normal':
				return this.wasmModule!.blend_normal(baseData, overlayData, opacity);
			case 'multiply':
				return this.wasmModule!.blend_multiply(baseData, overlayData, opacity);
			case 'screen':
				return this.wasmModule!.blend_screen(baseData, overlayData, opacity);
			case 'overlay':
				return this.wasmModule!.blend_overlay(baseData, overlayData, opacity);
			default:
				return baseData;
		}
	}

	private blendLayersJs(
		baseData: ImageData,
		overlayData: ImageData,
		blendMode: BlendMode,
		opacity: number
	): ImageData {
		const data = new Uint8ClampedArray(baseData.data);

		for (let i = 0; i < data.length; i += 4) {
			const baseAlpha = baseData.data[i + 3] / 255;
			const overlayAlpha = (overlayData.data[i + 3] / 255) * opacity;

			if (overlayAlpha <= 0) continue;

			for (let c = 0; c < 3; c++) {
				const baseC = baseData.data[i + c] / 255;
				const overlayC = overlayData.data[i + c] / 255;
				let blendC: number;

				switch (blendMode) {
					case 'normal':
						blendC = overlayC;
						break;
					case 'multiply':
						blendC = baseC * overlayC;
						break;
					case 'screen':
						blendC = 1 - (1 - baseC) * (1 - overlayC);
						break;
					case 'overlay':
						blendC = baseC < 0.5 ? 2 * baseC * overlayC : 1 - 2 * (1 - baseC) * (1 - overlayC);
						break;
					default:
						blendC = overlayC;
				}

				const outC = blendC * overlayAlpha + baseC * (1 - overlayAlpha);
				data[i + c] = Math.round(outC * 255);
			}

			const outAlpha = overlayAlpha + baseAlpha * (1 - overlayAlpha);
			data[i + 3] = Math.round(outAlpha * 255);
		}

		return new ImageData(data, baseData.width, baseData.height);
	}

	async chromaKey(
		imageData: ImageData,
		targetColor: { r: number; g: number; b: number },
		threshold: number,
		softness: number
	): Promise<ImageData> {
		if (this.wasmModule) {
			return this.wasmModule.chroma_key(
				imageData,
				targetColor.r,
				targetColor.g,
				targetColor.b,
				threshold,
				softness
			);
		}
		return this.chromaKeyJs(imageData, targetColor, threshold, softness);
	}

	private chromaKeyJs(
		imageData: ImageData,
		targetColor: { r: number; g: number; b: number },
		threshold: number,
		softness: number
	): ImageData {
		const data = new Uint8ClampedArray(imageData.data);
		const thresholdVal = threshold * 441.672955;
		const softnessVal = softness * 441.672955;

		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];

			const dr = r - targetColor.r;
			const dg = g - targetColor.g;
			const db = b - targetColor.b;
			const dist = Math.sqrt(dr * dr + dg * dg + db * db);

			if (dist <= thresholdVal) {
				data[i + 3] = 0;
			} else if (dist <= thresholdVal + softnessVal) {
				const alpha = (dist - thresholdVal) / softnessVal;
				data[i + 3] = Math.round(alpha * 255);
			}
		}

		return new ImageData(data, imageData.width, imageData.height);
	}

	async imageDataToBlob(imageData: ImageData, options: ExportOptions): Promise<Blob> {
		if (!this.canvas || !this.ctx) {
			throw new Error('Canvas not initialized');
		}

		this.canvas.width = imageData.width;
		this.canvas.height = imageData.height;
		this.ctx.putImageData(imageData, 0, 0);

		const mimeTypes: Record<string, string> = {
			jpeg: 'image/jpeg',
			png: 'image/png',
			webp: 'image/webp',
			avif: 'image/avif'
		};

		const mimeType = mimeTypes[options.format] || 'image/png';
		const quality = options.quality ?? 0.92;

		return this.canvas.convertToBlob({ type: mimeType, quality });
	}

	async fileToImageData(file: File): Promise<ImageData> {
		const bitmap = await createImageBitmap(file);
		
		if (!this.canvas || !this.ctx) {
			this.canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
			this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
		}

		this.canvas.width = bitmap.width;
		this.canvas.height = bitmap.height;
		this.ctx.drawImage(bitmap, 0, 0);
		
		return this.ctx.getImageData(0, 0, bitmap.width, bitmap.height);
	}
}

export const imageProcessor = new ImageProcessor();
