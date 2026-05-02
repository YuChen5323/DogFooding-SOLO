#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
野生动物救助中心模拟经营游戏 - 配置文件
"""

import os
import sys

# 项目基础路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
ASSETS_DIR = os.path.join(BASE_DIR, 'assets')

# 确保目录存在
for directory in [DATA_DIR, ASSETS_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)

# 数据库路径
DB_PATH = os.path.join(DATA_DIR, 'animal_rescue.db')
SAVE_PATH = os.path.join(DATA_DIR, 'savegame.dat')

# 游戏配置
SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
FPS = 60
TITLE = "野生动物救助中心"

# 颜色配置 - 自然绿地风格
COLORS = {
    'white': (255, 255, 255),
    'black': (0, 0, 0),
    'grass_light': (144, 238, 144),
    'grass_dark': (34, 139, 34),
    'grass_green': (76, 175, 80),
    'leaf_green': (102, 187, 106),
    'mint_green': (129, 199, 132),
    'sky_blue': (135, 206, 235),
    'light_blue': (173, 216, 230),
    'cream': (255, 253, 208),
    'beige': (245, 245, 220),
    'wood_brown': (139, 90, 43),
    'light_brown': (160, 82, 45),
    'red': (220, 20, 60),
    'green': (0, 128, 0),
    'yellow': (255, 215, 0),
    'orange': (255, 165, 0),
    'purple': (128, 0, 128),
    'gray': (128, 128, 128),
    'dark_gray': (64, 64, 64),
    'transparent': (0, 0, 0, 0),
}

# 按钮样式
BUTTON_STYLE = {
    'normal': {
        'bg': COLORS['grass_green'],
        'text': COLORS['white'],
        'border': COLORS['grass_dark']
    },
    'hover': {
        'bg': COLORS['leaf_green'],
        'text': COLORS['white'],
        'border': COLORS['grass_light']
    },
    'disabled': {
        'bg': COLORS['gray'],
        'text': COLORS['dark_gray'],
        'border': COLORS['dark_gray']
    }
}

# 动物类型配置
ANIMAL_TYPES = {
    'panda': {
        'name': '大熊猫',
        'scientific_name': 'Ailuropoda melanoleuca',
        'type': 'mammal',
        'rarity': 'legendary',
        'base_health': 100,
        'base_hunger': 100,
        'base_happiness': 50,
        'diet': 'bamboo',
        'natural_habitat': 'forest',
        'conservation_status': 'vulnerable',
        'rescue_probability': 0.05,
        'value': 1000
    },
    'tiger': {
        'name': '东北虎',
        'scientific_name': 'Panthera tigris altaica',
        'type': 'mammal',
        'rarity': 'epic',
        'base_health': 100,
        'base_hunger': 100,
        'base_happiness': 40,
        'diet': 'meat',
        'natural_habitat': 'forest',
        'conservation_status': 'endangered',
        'rescue_probability': 0.1,
        'value': 800
    },
    'deer': {
        'name': '梅花鹿',
        'scientific_name': 'Cervus nippon',
        'type': 'mammal',
        'rarity': 'rare',
        'base_health': 100,
        'base_hunger': 100,
        'base_happiness': 60,
        'diet': 'herbivore',
        'natural_habitat': 'forest',
        'conservation_status': 'least_concern',
        'rescue_probability': 0.2,
        'value': 300
    },
    'eagle': {
        'name': '金雕',
        'scientific_name': 'Aquila chrysaetos',
        'type': 'bird',
        'rarity': 'rare',
        'base_health': 100,
        'base_hunger': 100,
        'base_happiness': 55,
        'diet': 'meat',
        'natural_habitat': 'mountain',
        'conservation_status': 'least_concern',
        'rescue_probability': 0.15,
        'value': 400
    },
    'owl': {
        'name': '猫头鹰',
        'scientific_name': 'Strigiformes',
        'type': 'bird',
        'rarity': 'common',
        'base_health': 100,
        'base_hunger': 100,
        'base_happiness': 70,
        'diet': 'meat',
        'natural_habitat': 'forest',
        'conservation_status': 'least_concern',
        'rescue_probability': 0.25,
        'value': 200
    },
    'rabbit': {
        'name': '野兔',
        'scientific_name': 'Lepus',
        'type': 'mammal',
        'rarity': 'common',
        'base_health': 100,
        'base_hunger': 100,
        'base_happiness': 65,
        'diet': 'herbivore',
        'natural_habitat': 'grassland',
        'conservation_status': 'least_concern',
        'rescue_probability': 0.3,
        'value': 100
    },
    'fox': {
        'name': '赤狐',
        'scientific_name': 'Vulpes vulpes',
        'type': 'mammal',
        'rarity': 'uncommon',
        'base_health': 100,
        'base_hunger': 100,
        'base_happiness': 50,
        'diet': 'omnivore',
        'natural_habitat': 'forest',
        'conservation_status': 'least_concern',
        'rescue_probability': 0.2,
        'value': 250
    },
    'turtle': {
        'name': '陆龟',
        'scientific_name': 'Testudinidae',
        'type': 'reptile',
        'rarity': 'uncommon',
        'base_health': 100,
        'base_hunger': 100,
        'base_happiness': 75,
        'diet': 'herbivore',
        'natural_habitat': 'desert',
        'conservation_status': 'vulnerable',
        'rescue_probability': 0.15,
        'value': 350
    }
}

# 伤势类型
INJURY_TYPES = {
    'fracture': {
        'name': '骨折',
        'severity': 'medium',
        'treatment_time': 48,
        'symptoms': ['疼痛', '活动受限', '肿胀'],
        'requires_xray': True,
        'healing_rate': 0.5
    },
    'wound': {
        'name': '伤口感染',
        'severity': 'medium',
        'treatment_time': 24,
        'symptoms': ['发热', '流脓', '红肿'],
        'requires_xray': False,
        'healing_rate': 1.0
    },
    'poisoning': {
        'name': '中毒',
        'severity': 'high',
        'treatment_time': 12,
        'symptoms': ['呕吐', '腹泻', '虚弱'],
        'requires_xray': False,
        'healing_rate': 1.5
    },
    'dehydration': {
        'name': '脱水',
        'severity': 'medium',
        'treatment_time': 6,
        'symptoms': ['口渴', '眼窝凹陷', '皮肤弹性差'],
        'requires_xray': False,
        'healing_rate': 2.0
    },
    'starvation': {
        'name': '营养不良',
        'severity': 'medium',
        'treatment_time': 36,
        'symptoms': ['消瘦', '虚弱', '毛发粗糙'],
        'requires_xray': False,
        'healing_rate': 0.8
    },
    'parasites': {
        'name': '寄生虫感染',
        'severity': 'low',
        'treatment_time': 18,
        'symptoms': ['瘙痒', '脱毛', '消瘦'],
        'requires_xray': False,
        'healing_rate': 1.2
    },
    'respiratory': {
        'name': '呼吸道感染',
        'severity': 'medium',
        'treatment_time': 30,
        'symptoms': ['咳嗽', '打喷嚏', '呼吸困难'],
        'requires_xray': True,
        'healing_rate': 0.7
    },
    'eye_injury': {
        'name': '眼部受伤',
        'severity': 'medium',
        'treatment_time': 24,
        'symptoms': ['流泪', '红肿', '视力下降'],
        'requires_xray': False,
        'healing_rate': 0.9
    }
}

# 治疗项目
TREATMENTS = {
    'bandage': {
        'name': '包扎',
        'description': '处理外伤伤口',
        'cost': 50,
        'effectiveness': 1.0,
        'applies_to': ['wound', 'fracture', 'eye_injury']
    },
    'medicine': {
        'name': '药物治疗',
        'description': '使用抗生素或止痛药',
        'cost': 100,
        'effectiveness': 1.5,
        'applies_to': ['wound', 'respiratory', 'parasites', 'poisoning']
    },
    'surgery': {
        'name': '手术',
        'description': '复杂骨折或内伤手术',
        'cost': 500,
        'effectiveness': 2.0,
        'applies_to': ['fracture', 'poisoning']
    },
    'iv_fluid': {
        'name': '输液',
        'description': '补充水分和营养',
        'cost': 80,
        'effectiveness': 1.2,
        'applies_to': ['dehydration', 'starvation', 'poisoning']
    },
    'special_food': {
        'name': '特殊饮食',
        'description': '定制营养食谱',
        'cost': 60,
        'effectiveness': 0.8,
        'applies_to': ['starvation', 'dehydration', 'parasites']
    },
    'physical_therapy': {
        'name': '物理治疗',
        'description': '康复锻炼',
        'cost': 120,
        'effectiveness': 1.3,
        'applies_to': ['fracture', 'respiratory']
    }
}

# 训练项目
TRAINING_PROGRAMS = {
    'hunting': {
        'name': '捕食训练',
        'description': '训练动物获取食物的能力',
        'success_rate_boost': 0.15,
        'energy_cost': 20,
        'time_cost': 30,
        'required_skills': ['speed', 'agility']
    },
    'hiding': {
        'name': '躲避训练',
        'description': '训练动物躲避天敌的能力',
        'success_rate_boost': 0.12,
        'energy_cost': 15,
        'time_cost': 25,
        'required_skills': ['stealth', 'awareness']
    },
    'navigation': {
        'name': '导航训练',
        'description': '训练动物在野外定位的能力',
        'success_rate_boost': 0.10,
        'energy_cost': 10,
        'time_cost': 20,
        'required_skills': ['memory', 'sense']
    },
    'social': {
        'name': '社交训练',
        'description': '训练动物与同类互动的能力',
        'success_rate_boost': 0.08,
        'energy_cost': 12,
        'time_cost': 15,
        'required_skills': ['communication', 'tolerance']
    },
    'stress_resistance': {
        'name': '抗压训练',
        'description': '提高动物应对野外压力的能力',
        'success_rate_boost': 0.10,
        'energy_cost': 18,
        'time_cost': 22,
        'required_skills': ['resilience', 'adaptability']
    }
}

# 游戏状态
GAME_STATES = {
    'menu': '主菜单',
    'game': '游戏主界面',
    'rescue': '动物收容',
    'examination': '体检',
    'xray_puzzle': 'X光拼图',
    'blood_test': '采血化验',
    'cage': '笼舍管理',
    'treatment': '治疗',
    'training': '行为训练',
    'release': '野放追踪',
    'pause': '暂停',
    'game_over': '游戏结束'
}

# 语言配置
LANGUAGES = {
    'zh': {
        'name': '中文',
        'code': 'zh_CN',
        'encoding': 'utf-8'
    },
    'en': {
        'name': 'English',
        'code': 'en_US',
        'encoding': 'utf-8'
    },
    'ja': {
        'name': '日本語',
        'code': 'ja_JP',
        'encoding': 'utf-8'
    }
}

# 默认语言
DEFAULT_LANGUAGE = 'zh'

# 游戏平衡参数
GAME_BALANCE = {
    'base_money': 5000,
    'base_reputation': 50,
    'base_animal_capacity': 10,
    'animal_hunger_decay': 0.5,
    'animal_happiness_decay': 0.3,
    'health_recovery_rate': 0.1,
    'treatment_cost_multiplier': 1.0,
    'donation_reputation_multiplier': 10.0,
    'release_success_reputation': 20,
    'release_failure_reputation': -10,
    'rescue_new_animal_interval': 300,
    'max_cage_temperature': 35,
    'min_cage_temperature': 10,
    'optimal_temperature': 22,
    'max_cage_humidity': 90,
    'min_cage_humidity': 20,
    'optimal_humidity': 60
}

# 存档版本
SAVE_VERSION = 1
