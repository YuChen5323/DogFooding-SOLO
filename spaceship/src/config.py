SCREEN_WIDTH = 1600
SCREEN_HEIGHT = 900
FPS = 60
GRAVITY = (0, 0)

NEON_COLORS = {
    'cyan': (0, 255, 255),
    'magenta': (255, 0, 255),
    'yellow': (255, 255, 0),
    'green': (0, 255, 0),
    'pink': (255, 105, 180),
    'white': (255, 255, 255),
    'orange': (255, 165, 0),
    'dark_bg': (10, 10, 30),
    'menu_bg': (20, 20, 50)
}

MODULE_PRESETS = {
    'wings': [
        {
            'id': 'wing_small',
            'name': '小型机翼',
            'module_type': 'wing',
            'width': 60,
            'height': 15,
            'mass': 20,
            'density': 1.0,
            'color': NEON_COLORS['cyan'],
            'properties': {'lift_coefficient': 0.5}
        },
        {
            'id': 'wing_large',
            'name': '大型机翼',
            'module_type': 'wing',
            'width': 100,
            'height': 20,
            'mass': 50,
            'density': 1.0,
            'color': NEON_COLORS['green'],
            'properties': {'lift_coefficient': 0.8}
        }
    ],
    'engines': [
        {
            'id': 'engine_small',
            'name': '小型引擎',
            'module_type': 'engine',
            'width': 30,
            'height': 40,
            'mass': 40,
            'density': 2.0,
            'color': NEON_COLORS['orange'],
            'properties': {'thrust': 1000, 'fuel_consumption': 1.0}
        },
        {
            'id': 'engine_large',
            'name': '大型引擎',
            'module_type': 'engine',
            'width': 50,
            'height': 60,
            'mass': 100,
            'density': 2.0,
            'color': NEON_COLORS['yellow'],
            'properties': {'thrust': 2500, 'fuel_consumption': 2.0}
        }
    ],
    'weapons': [
        {
            'id': 'laser_small',
            'name': '小型激光炮',
            'module_type': 'weapon',
            'width': 25,
            'height': 30,
            'mass': 15,
            'density': 1.5,
            'color': NEON_COLORS['pink'],
            'properties': {'damage': 10, 'fire_rate': 10.0}
        },
        {
            'id': 'laser_large',
            'name': '大型激光炮',
            'module_type': 'weapon',
            'width': 40,
            'height': 50,
            'mass': 40,
            'density': 1.5,
            'color': NEON_COLORS['magenta'],
            'properties': {'damage': 30, 'fire_rate': 3.0}
        }
    ],
    'core': [
        {
            'id': 'core_basic',
            'name': '基础核心',
            'module_type': 'core',
            'width': 60,
            'height': 80,
            'mass': 80,
            'density': 1.5,
            'color': NEON_COLORS['white'],
            'properties': {'health': 100, 'energy': 100}
        },
        {
            'id': 'core_heavy',
            'name': '重型核心',
            'module_type': 'core',
            'width': 80,
            'height': 100,
            'mass': 150,
            'density': 1.5,
            'color': NEON_COLORS['cyan'],
            'properties': {'health': 200, 'energy': 150}
        }
    ]
}
