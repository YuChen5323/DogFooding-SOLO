import pygame

SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
FPS = 60
TITLE = "城堡围攻 - Castle Siege Simulator"

GRID_SIZE = 32
GRID_COLS = 30
GRID_ROWS = 18

GRAVITY = 900.0
DAMPING = 0.99
GROUND_Y = SCREEN_HEIGHT - 40

class Colors:
    DARK_IRON = (45, 48, 53)
    MEDIUM_IRON = (60, 64, 72)
    LIGHT_IRON = (80, 84, 92)
    PARCHMENT = (240, 228, 200)
    PARCHMENT_DARK = (210, 198, 170)
    PARCHMENT_LIGHT = (250, 240, 220)
    ACCENT_GOLD = (180, 150, 60)
    ACCENT_RED = (160, 40, 40)
    ACCENT_GREEN = (40, 120, 60)
    ACCENT_BLUE = (60, 90, 140)
    STONE = (100, 100, 105)
    STONE_LIGHT = (120, 120, 125)
    STONE_DARK = (70, 70, 75)
    WOOD = (130, 90, 45)
    WOOD_LIGHT = (150, 110, 65)
    WOOD_DARK = (100, 60, 30)
    FIRE = (220, 100, 20)
    FIRE_LIGHT = (255, 160, 40)
    OIL = (40, 30, 20)
    BLOOD = (120, 20, 20)
    
    BACKGROUND = (35, 38, 42)
    GROUND = (55, 45, 35)
    SKY = (80, 90, 110)
    
    BUTTON_NORMAL = MEDIUM_IRON
    BUTTON_HOVER = LIGHT_IRON
    BUTTON_CLICK = DARK_IRON
    BUTTON_TEXT = PARCHMENT_LIGHT
    
    PANEL = DARK_IRON
    PANEL_BORDER = MEDIUM_IRON
    TEXT = PARCHMENT
    TEXT_DARK = (160, 150, 130)

class BuildingTypes:
    STONE_BLOCK = {
        'name': '石砖',
        'width': GRID_SIZE,
        'height': GRID_SIZE,
        'density': 1.0,
        'friction': 0.6,
        'elasticity': 0.2,
        'health': 100,
        'flammable': False,
        'color': Colors.STONE,
        'cost': {'stone': 1}
    }
    
    STONE_CORNER = {
        'name': '城垛',
        'width': GRID_SIZE,
        'height': GRID_SIZE,
        'density': 1.2,
        'friction': 0.7,
        'elasticity': 0.15,
        'health': 120,
        'flammable': False,
        'color': Colors.STONE_LIGHT,
        'cost': {'stone': 2}
    }
    
    WOOD_BEAM = {
        'name': '木梁',
        'width': GRID_SIZE * 2,
        'height': GRID_SIZE,
        'density': 0.6,
        'friction': 0.4,
        'elasticity': 0.3,
        'health': 60,
        'flammable': True,
        'burn_time': 5000,
        'color': Colors.WOOD,
        'cost': {'wood': 1}
    }
    
    WOOD_FLOOR = {
        'name': '木地板',
        'width': GRID_SIZE,
        'height': GRID_SIZE // 2,
        'density': 0.5,
        'friction': 0.5,
        'elasticity': 0.25,
        'health': 40,
        'flammable': True,
        'burn_time': 3000,
        'color': Colors.WOOD_LIGHT,
        'cost': {'wood': 1}
    }

class SiegeWeapons:
    CATAPULT = {
        'name': '投石机',
        'description': '发射石块，破坏城墙',
        'cost': {'wood': 5, 'stone': 3},
        'build_time': 10,
        'projectile_mass': 50,
        'damage': 80,
        'range': 500,
        'reload_time': 3.0,
        'color': Colors.WOOD_DARK
    }
    
    BATTERING_RAM = {
        'name': '冲车',
        'description': '冲撞城门和城墙',
        'cost': {'wood': 8, 'stone': 1},
        'build_time': 15,
        'damage_per_hit': 150,
        'speed': 50,
        'color': Colors.WOOD
    }
    
    SIEGE_TOWER = {
        'name': '攻城塔',
        'description': '运载士兵接近城墙',
        'cost': {'wood': 10},
        'build_time': 20,
        'soldier_capacity': 5,
        'speed': 30,
        'color': Colors.WOOD_LIGHT
    }
    
    FIRE_ARROW = {
        'name': '火焰箭',
        'description': '点燃木质结构',
        'cost': {'wood': 2, 'oil': 1},
        'build_time': 3,
        'projectile_mass': 5,
        'damage': 30,
        'burn_damage': 5,
        'range': 400,
        'reload_time': 1.5,
        'color': Colors.FIRE
    }

class Resources:
    STARTING = {
        'stone': 50,
        'wood': 40,
        'oil': 10,
        'gold': 100
    }
    
    NAMES = {
        'stone': '石料',
        'wood': '木材',
        'oil': '燃油',
        'gold': '金币'
    }
    
    COLORS = {
        'stone': Colors.STONE_LIGHT,
        'wood': Colors.WOOD_LIGHT,
        'oil': Colors.OIL,
        'gold': Colors.ACCENT_GOLD
    }

class UnitTypes:
    ARCHER = {
        'name': '弓箭手',
        'health': 50,
        'damage': 15,
        'range': 300,
        'attack_speed': 1.0,
        'cost': {'gold': 20},
        'color': Colors.ACCENT_GREEN
    }
    
    INFANTRY = {
        'name': '步兵',
        'health': 80,
        'damage': 25,
        'range': 40,
        'attack_speed': 0.8,
        'speed': 60,
        'cost': {'gold': 15},
        'color': Colors.ACCENT_RED
    }
    
    KNIGHT = {
        'name': '骑士',
        'health': 150,
        'damage': 40,
        'range': 50,
        'attack_speed': 0.6,
        'speed': 100,
        'cost': {'gold': 50},
        'color': Colors.ACCENT_GOLD
    }

class GameStates:
    MENU = 'menu'
    EDITOR = 'editor'
    SIEGE_BUILD = 'siege_build'
    BATTLE = 'battle'
    PAUSED = 'paused'
    VICTORY = 'victory'
    DEFEAT = 'defeat'

class PhysicsLayers:
    GROUND = 1
    BUILDING = 2
    PROJECTILE = 4
    UNIT = 8
    SIEGE_WEAPON = 16
    DEBRIS = 32
