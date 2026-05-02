import type { VisualPreset, VisualPresetConfig } from '$lib/types/game';

export const DEFAULT_VISUAL_PRESETS: Record<VisualPreset, VisualPresetConfig> = {
	cyberpunk: {
		name: '赛博朋克',
		background: '#0a0a1a',
		stars: ['#00ffff', '#ff00ff', '#ffffff', '#ffff00'],
		nebulae: ['#00ffff33', '#ff00ff33', '#ffff0033'],
		bullets: ['#00ffff', '#ff00ff', '#00ff00'],
		playerShip: '#ff00ff',
		enemies: ['#ff0066', '#ff3300', '#ff6600'],
		accent: '#00ffff',
		glow: '#00ffff'
	},
	synthwave: {
		name: '合成器波',
		background: '#1a0a2e',
		stars: ['#ff6b9d', '#c44569', '#ff0080', '#ff8fab'],
		nebulae: ['#ff6b9d33', '#c4456933', '#ff008033'],
		bullets: ['#ff6b9d', '#ff0080', '#ff8fab'],
		playerShip: '#ff0080',
		enemies: ['#00ffff', '#00ff88', '#00ccff'],
		accent: '#ff6b9d',
		glow: '#ff0080'
	},
	matrix: {
		name: '矩阵',
		background: '#001100',
		stars: ['#00ff00', '#00cc00', '#00aa00', '#00ff88'],
		nebulae: ['#00ff0033', '#00ff8833', '#00cc0033'],
		bullets: ['#00ff00', '#00ff88', '#88ff00'],
		playerShip: '#00ff88',
		enemies: ['#ff0000', '#ff3300', '#cc0000'],
		accent: '#00ff00',
		glow: '#00ff00'
	},
	fire: {
		name: '烈焰',
		background: '#1a0505',
		stars: ['#ff0000', '#ff6600', '#ffcc00', '#ffffff'],
		nebulae: ['#ff000033', '#ff660033', '#ffcc0033'],
		bullets: ['#ff0000', '#ff6600', '#ffcc00'],
		playerShip: '#ff6600',
		enemies: ['#00ffff', '#0088ff', '#0044ff'],
		accent: '#ff6600',
		glow: '#ff0000'
	},
	ice: {
		name: '寒冰',
		background: '#05101a',
		stars: ['#00ffff', '#0088ff', '#ffffff', '#88ffff'],
		nebulae: ['#00ffff33', '#0088ff33', '#88ffff33'],
		bullets: ['#00ffff', '#0088ff', '#88ffff'],
		playerShip: '#00ffff',
		enemies: ['#ff0066', '#ff00ff', '#ff3366'],
		accent: '#00ffff',
		glow: '#00ffff'
	},
	galaxy: {
		name: '星系',
		background: '#000011',
		stars: ['#ffffff', '#ccccff', '#ffccff', '#ccccff'],
		nebulae: ['#ff00ff33', '#00ffff33', '#ffff0033', '#ff66cc33'],
		bullets: ['#ffffff', '#ffccff', '#ccccff'],
		playerShip: '#ffffff',
		enemies: ['#ff3300', '#ff6600', '#ffcc00'],
		accent: '#ccccff',
		glow: '#ffffff'
	}
};

export const getPresetColors = (preset: VisualPreset): VisualPresetConfig => {
	return DEFAULT_VISUAL_PRESETS[preset];
};

export const getAllPresets = (): { key: VisualPreset; config: VisualPresetConfig }[] => {
	return Object.entries(DEFAULT_VISUAL_PRESETS).map(([key, config]) => ({
		key: key as VisualPreset,
		config
	}));
};
