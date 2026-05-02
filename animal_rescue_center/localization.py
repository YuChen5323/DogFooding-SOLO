#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
野生动物救助中心模拟经营游戏 - 多语言系统
"""

import os
import json
from config import LANGUAGES, DEFAULT_LANGUAGE, ASSETS_DIR


class LocalizationManager:
    """多语言管理器"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.current_language = DEFAULT_LANGUAGE
        self.translations = {}
        self._load_all_translations()
        self._initialized = True
    
    def _load_all_translations(self):
        """加载所有语言的翻译"""
        
        self.translations['zh'] = self._get_chinese_translations()
        self.translations['en'] = self._get_english_translations()
        self.translations['ja'] = self._get_japanese_translations()
        
        i18n_dir = os.path.join(ASSETS_DIR, 'i18n')
        if os.path.exists(i18n_dir):
            for lang_code in LANGUAGES:
                lang_file = os.path.join(i18n_dir, f'{lang_code}.json')
                if os.path.exists(lang_file):
                    try:
                        with open(lang_file, 'r', encoding='utf-8') as f:
                            external_translations = json.load(f)
                            self.translations[lang_code].update(external_translations)
                    except Exception as e:
                        print(f"Failed to load external translations for {lang_code}: {e}")
    
    def _get_chinese_translations(self):
        """获取中文翻译"""
        return {
            'game_title': '野生动物救助中心',
            'menu': '菜单',
            'start_game': '开始游戏',
            'load_game': '读取存档',
            'settings': '设置',
            'language': '语言',
            'chinese': '中文',
            'english': 'English',
            'japanese': '日本語',
            'quit': '退出游戏',
            
            'rescue_center': '救助中心',
            'reputation': '声望',
            'money': '资金',
            'day': '第',
            'day_suffix': '天',
            'animals': '动物数量',
            'capacity': '容量',
            
            'rescue': '收容',
            'examination': '体检',
            'cage': '笼舍',
            'treatment': '治疗',
            'training': '训练',
            'release': '野放',
            'save': '存档',
            
            'new_animal_arrived': '新动物到达！',
            'animal_type': '动物种类',
            'condition': '状态',
            'accept': '接收',
            'reject': '拒绝',
            'animal_accepted': '动物已接收',
            'animal_rejected': '动物已拒绝',
            
            'physical_examination': '体检',
            'palpation': '触诊',
            'xray': 'X光检查',
            'blood_test': '采血化验',
            'symptoms': '症状',
            'diagnosis': '诊断',
            'health': '健康',
            'hunger': '饥饿',
            'happiness': '快乐',
            'complete': '完成',
            
            'xray_puzzle': 'X光拼图',
            'rotate': '旋转',
            'swap': '交换',
            'time_limit': '剩余时间',
            'puzzle_complete': '拼图完成！',
            'puzzle_failed': '拼图失败，时间耗尽',
            
            'blood_test_result': '血液化验结果',
            'white_blood_cells': '白细胞',
            'red_blood_cells': '红细胞',
            'platelets': '血小板',
            'glucose': '血糖',
            'normal': '正常',
            'high': '偏高',
            'low': '偏低',
            
            'cage_management': '笼舍管理',
            'cage': '笼舍',
            'temperature': '温度',
            'humidity': '湿度',
            'optimal': '最佳',
            'feed': '投喂',
            'observe': '观察',
            'activity': '活动',
            'appetite': '食欲',
            'activity_curve': '活动曲线',
            'appetite_curve': '食欲曲线',
            
            'treatment': '治疗',
            'bandage': '包扎',
            'medicine': '药物治疗',
            'surgery': '手术',
            'iv_fluid': '输液',
            'special_food': '特殊饮食',
            'physical_therapy': '物理治疗',
            'cost': '费用',
            'effectiveness': '效果',
            'start_treatment': '开始治疗',
            'treatment_in_progress': '治疗进行中',
            'treatment_complete': '治疗完成',
            
            'behavior_training': '行为训练',
            'hunting': '捕食训练',
            'hiding': '躲避训练',
            'navigation': '导航训练',
            'social': '社交训练',
            'stress_resistance': '抗压训练',
            'success_rate': '野放成功率',
            'energy_cost': '消耗体力',
            'time_cost': '消耗时间',
            'start_training': '开始训练',
            'training_complete': '训练完成',
            
            'release_tracking': '野放追踪',
            'release_to_wild': '野放',
            'map': '地图',
            'location': '位置',
            'survival_rate': '存活率',
            'survived': '存活',
            'deceased': '死亡',
            'released': '已野放',
            'donation': '捐款',
            'reputation_change': '声望变化',
            
            'pause_menu': '暂停菜单',
            'resume': '继续游戏',
            'save_game': '保存游戏',
            'load_game': '读取存档',
            'return_menu': '返回主菜单',
            'confirm_quit': '确定要退出吗？',
            'yes': '是',
            'no': '否',
            
            'save_successful': '存档成功',
            'save_failed': '存档失败',
            'load_successful': '读档成功',
            'load_failed': '读档失败',
            'no_save_found': '未找到存档',
            
            'error': '错误',
            'warning': '警告',
            'success': '成功',
            'info': '信息',
            
            'common': '普通',
            'uncommon': '罕见',
            'rare': '稀有',
            'epic': '史诗',
            'legendary': '传说',
            
            'low': '低',
            'medium': '中',
            'high': '高',
            'critical': '危急',
            
            'least_concern': '无危',
            'near_threatened': '近危',
            'vulnerable': '易危',
            'endangered': '濒危',
            'critically_endangered': '极危',
            'extinct_in_wild': '野外灭绝',
            'extinct': '灭绝',
            
            'mammal': '哺乳动物',
            'bird': '鸟类',
            'reptile': '爬行动物',
            'amphibian': '两栖动物',
            'fish': '鱼类',
            'insect': '昆虫',
            
            'forest': '森林',
            'grassland': '草原',
            'wetland': '湿地',
            'desert': '沙漠',
            'mountain': '山地',
            'ocean': '海洋',
            
            'meat': '肉食',
            'herbivore': '草食',
            'omnivore': '杂食',
            'bamboo': '竹子',
            'fish': '鱼类',
            'insects': '昆虫'
        }
    
    def _get_english_translations(self):
        """获取英文翻译"""
        return {
            'game_title': 'Wildlife Rescue Center',
            'menu': 'Menu',
            'start_game': 'Start Game',
            'load_game': 'Load Game',
            'settings': 'Settings',
            'language': 'Language',
            'chinese': '中文',
            'english': 'English',
            'japanese': '日本語',
            'quit': 'Quit Game',
            
            'rescue_center': 'Rescue Center',
            'reputation': 'Reputation',
            'money': 'Money',
            'day': 'Day',
            'day_suffix': '',
            'animals': 'Animals',
            'capacity': 'Capacity',
            
            'rescue': 'Rescue',
            'examination': 'Examination',
            'cage': 'Cage',
            'treatment': 'Treatment',
            'training': 'Training',
            'release': 'Release',
            'save': 'Save',
            
            'new_animal_arrived': 'New Animal Arrived!',
            'animal_type': 'Animal Type',
            'condition': 'Condition',
            'accept': 'Accept',
            'reject': 'Reject',
            'animal_accepted': 'Animal Accepted',
            'animal_rejected': 'Animal Rejected',
            
            'physical_examination': 'Physical Examination',
            'palpation': 'Palpation',
            'xray': 'X-Ray',
            'blood_test': 'Blood Test',
            'symptoms': 'Symptoms',
            'diagnosis': 'Diagnosis',
            'health': 'Health',
            'hunger': 'Hunger',
            'happiness': 'Happiness',
            'complete': 'Complete',
            
            'xray_puzzle': 'X-Ray Puzzle',
            'rotate': 'Rotate',
            'swap': 'Swap',
            'time_limit': 'Time Left',
            'puzzle_complete': 'Puzzle Complete!',
            'puzzle_failed': 'Puzzle Failed, Time Out',
            
            'blood_test_result': 'Blood Test Results',
            'white_blood_cells': 'White Blood Cells',
            'red_blood_cells': 'Red Blood Cells',
            'platelets': 'Platelets',
            'glucose': 'Glucose',
            'normal': 'Normal',
            'high': 'High',
            'low': 'Low',
            
            'cage_management': 'Cage Management',
            'cage': 'Cage',
            'temperature': 'Temperature',
            'humidity': 'Humidity',
            'optimal': 'Optimal',
            'feed': 'Feed',
            'observe': 'Observe',
            'activity': 'Activity',
            'appetite': 'Appetite',
            'activity_curve': 'Activity Curve',
            'appetite_curve': 'Appetite Curve',
            
            'treatment': 'Treatment',
            'bandage': 'Bandage',
            'medicine': 'Medicine',
            'surgery': 'Surgery',
            'iv_fluid': 'IV Fluid',
            'special_food': 'Special Diet',
            'physical_therapy': 'Physical Therapy',
            'cost': 'Cost',
            'effectiveness': 'Effectiveness',
            'start_treatment': 'Start Treatment',
            'treatment_in_progress': 'Treatment In Progress',
            'treatment_complete': 'Treatment Complete',
            
            'behavior_training': 'Behavior Training',
            'hunting': 'Hunting Training',
            'hiding': 'Hiding Training',
            'navigation': 'Navigation Training',
            'social': 'Social Training',
            'stress_resistance': 'Stress Resistance',
            'success_rate': 'Release Success Rate',
            'energy_cost': 'Energy Cost',
            'time_cost': 'Time Cost',
            'start_training': 'Start Training',
            'training_complete': 'Training Complete',
            
            'release_tracking': 'Release Tracking',
            'release_to_wild': 'Release to Wild',
            'map': 'Map',
            'location': 'Location',
            'survival_rate': 'Survival Rate',
            'survived': 'Survived',
            'deceased': 'Deceased',
            'released': 'Released',
            'donation': 'Donation',
            'reputation_change': 'Reputation Change',
            
            'pause_menu': 'Pause Menu',
            'resume': 'Resume Game',
            'save_game': 'Save Game',
            'load_game': 'Load Game',
            'return_menu': 'Return to Menu',
            'confirm_quit': 'Are you sure you want to quit?',
            'yes': 'Yes',
            'no': 'No',
            
            'save_successful': 'Save Successful',
            'save_failed': 'Save Failed',
            'load_successful': 'Load Successful',
            'load_failed': 'Load Failed',
            'no_save_found': 'No Save Found',
            
            'error': 'Error',
            'warning': 'Warning',
            'success': 'Success',
            'info': 'Info',
            
            'common': 'Common',
            'uncommon': 'Uncommon',
            'rare': 'Rare',
            'epic': 'Epic',
            'legendary': 'Legendary',
            
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',
            'critical': 'Critical',
            
            'least_concern': 'Least Concern',
            'near_threatened': 'Near Threatened',
            'vulnerable': 'Vulnerable',
            'endangered': 'Endangered',
            'critically_endangered': 'Critically Endangered',
            'extinct_in_wild': 'Extinct in Wild',
            'extinct': 'Extinct',
            
            'mammal': 'Mammal',
            'bird': 'Bird',
            'reptile': 'Reptile',
            'amphibian': 'Amphibian',
            'fish': 'Fish',
            'insect': 'Insect',
            
            'forest': 'Forest',
            'grassland': 'Grassland',
            'wetland': 'Wetland',
            'desert': 'Desert',
            'mountain': 'Mountain',
            'ocean': 'Ocean',
            
            'meat': 'Carnivore',
            'herbivore': 'Herbivore',
            'omnivore': 'Omnivore',
            'bamboo': 'Bamboo',
            'fish': 'Fish',
            'insects': 'Insects'
        }
    
    def _get_japanese_translations(self):
        """获取日文翻译"""
        return {
            'game_title': '野生動物救助センター',
            'menu': 'メニュー',
            'start_game': 'ゲーム開始',
            'load_game': 'セーブ読込',
            'settings': '設定',
            'language': '言語',
            'chinese': '中文',
            'english': 'English',
            'japanese': '日本語',
            'quit': 'ゲーム終了',
            
            'rescue_center': '救助センター',
            'reputation': '評判',
            'money': '資金',
            'day': '第',
            'day_suffix': '日目',
            'animals': '動物数',
            'capacity': '収容可能',
            
            'rescue': '収容',
            'examination': '検診',
            'cage': 'ケージ',
            'treatment': '治療',
            'training': '訓練',
            'release': '放獣',
            'save': 'セーブ',
            
            'new_animal_arrived': '新しい動物が到着！',
            'animal_type': '動物の種類',
            'condition': '状態',
            'accept': '受け入れ',
            'reject': '拒否',
            'animal_accepted': '動物を受け入れました',
            'animal_rejected': '動物を拒否しました',
            
            'physical_examination': '身体検査',
            'palpation': '触診',
            'xray': 'X線検査',
            'blood_test': '血液検査',
            'symptoms': '症状',
            'diagnosis': '診断',
            'health': '健康',
            'hunger': '空腹',
            'happiness': '幸福',
            'complete': '完了',
            
            'xray_puzzle': 'X線パズル',
            'rotate': '回転',
            'swap': '交換',
            'time_limit': '残り時間',
            'puzzle_complete': 'パズル完成！',
            'puzzle_failed': 'パズル失敗、時間切れ',
            
            'blood_test_result': '血液検査結果',
            'white_blood_cells': '白血球',
            'red_blood_cells': '赤血球',
            'platelets': '血小板',
            'glucose': '血糖',
            'normal': '正常',
            'high': '高い',
            'low': '低い',
            
            'cage_management': 'ケージ管理',
            'cage': 'ケージ',
            'temperature': '温度',
            'humidity': '湿度',
            'optimal': '最適',
            'feed': '給餌',
            'observe': '観察',
            'activity': '活動',
            'appetite': '食欲',
            'activity_curve': '活動曲線',
            'appetite_curve': '食欲曲線',
            
            'treatment': '治療',
            'bandage': '包帯',
            'medicine': '薬物治療',
            'surgery': '手術',
            'iv_fluid': '輸液',
            'special_food': '特別食事',
            'physical_therapy': '理学療法',
            'cost': '費用',
            'effectiveness': '効果',
            'start_treatment': '治療開始',
            'treatment_in_progress': '治療中',
            'treatment_complete': '治療完了',
            
            'behavior_training': '行動訓練',
            'hunting': '狩り訓練',
            'hiding': '隠れる訓練',
            'navigation': 'ナビゲーション訓練',
            'social': '社交訓練',
            'stress_resistance': 'ストレス耐性',
            'success_rate': '放獣成功率',
            'energy_cost': '消費体力',
            'time_cost': '消費時間',
            'start_training': '訓練開始',
            'training_complete': '訓練完了',
            
            'release_tracking': '放獣追跡',
            'release_to_wild': '放獣',
            'map': '地図',
            'location': '位置',
            'survival_rate': '生存率',
            'survived': '生存',
            'deceased': '死亡',
            'released': '放獣済',
            'donation': '寄付',
            'reputation_change': '評判変化',
            
            'pause_menu': '一時停止メニュー',
            'resume': 'ゲーム続行',
            'save_game': 'セーブ',
            'load_game': 'セーブ読込',
            'return_menu': 'メニューに戻る',
            'confirm_quit': '終了してもよろしいですか？',
            'yes': 'はい',
            'no': 'いいえ',
            
            'save_successful': 'セーブ成功',
            'save_failed': 'セーブ失敗',
            'load_successful': '読込成功',
            'load_failed': '読込失敗',
            'no_save_found': 'セーブが見つかりません',
            
            'error': 'エラー',
            'warning': '警告',
            'success': '成功',
            'info': '情報',
            
            'common': 'コモン',
            'uncommon': 'アンコモン',
            'rare': 'レア',
            'epic': 'エピック',
            'legendary': 'レジェンド',
            
            'low': '低',
            'medium': '中',
            'high': '高',
            'critical': '危急',
            
            'least_concern': '低リスク',
            'near_threatened': '準絶滅危惧',
            'vulnerable': '絶滅危惧II類',
            'endangered': '絶滅危惧IA類',
            'critically_endangered': '絶滅危惧IB類',
            'extinct_in_wild': '野生絶滅',
            'extinct': '絶滅',
            
            'mammal': '哺乳類',
            'bird': '鳥類',
            'reptile': '爬虫類',
            'amphibian': '両生類',
            'fish': '魚類',
            'insect': '昆虫類',
            
            'forest': '森林',
            'grassland': '草原',
            'wetland': '湿地',
            'desert': '砂漠',
            'mountain': '山地',
            'ocean': '海洋',
            
            'meat': '肉食',
            'herbivore': '草食',
            'omnivore': '雑食',
            'bamboo': '竹',
            'fish': '魚',
            'insects': '昆虫'
        }
    
    def set_language(self, lang_code):
        """设置当前语言"""
        if lang_code in LANGUAGES:
            self.current_language = lang_code
            return True
        return False
    
    def get_language(self):
        """获取当前语言"""
        return self.current_language
    
    def get_available_languages(self):
        """获取可用语言列表"""
        return [(code, info['name']) for code, info in LANGUAGES.items()]
    
    def t(self, key, *args, **kwargs):
        """
        获取翻译文本
        :param key: 翻译键
        :param args: 位置参数
        :param kwargs: 关键字参数
        :return: 翻译后的文本
        """
        lang = self.current_language
        if lang in self.translations and key in self.translations[lang]:
            text = self.translations[lang][key]
        else:
            if DEFAULT_LANGUAGE in self.translations and key in self.translations[DEFAULT_LANGUAGE]:
                text = self.translations[DEFAULT_LANGUAGE][key]
            else:
                text = key
        
        if args:
            try:
                text = text.format(*args)
            except:
                pass
        
        if kwargs:
            try:
                text = text.format(**kwargs)
            except:
                pass
        
        return text
    
    def translate_animal_type(self, animal_key):
        """翻译动物类型"""
        from config import ANIMAL_TYPES
        if animal_key in ANIMAL_TYPES:
            animal = ANIMAL_TYPES[animal_key]
            lang = self.current_language
            
            if lang == 'zh':
                return animal['name']
            elif lang == 'ja':
                return animal['name']
            else:
                return animal_key.replace('_', ' ').title()
        return animal_key
    
    def translate_rarity(self, rarity):
        """翻译稀有度"""
        rarity_map = {
            'common': self.t('common'),
            'uncommon': self.t('uncommon'),
            'rare': self.t('rare'),
            'epic': self.t('epic'),
            'legendary': self.t('legendary')
        }
        return rarity_map.get(rarity, rarity)
    
    def translate_severity(self, severity):
        """翻译严重程度"""
        severity_map = {
            'low': self.t('low'),
            'medium': self.t('medium'),
            'high': self.t('high'),
            'critical': self.t('critical')
        }
        return severity_map.get(severity, severity)
    
    def translate_conservation_status(self, status):
        """翻译保护等级"""
        status_map = {
            'least_concern': self.t('least_concern'),
            'near_threatened': self.t('near_threatened'),
            'vulnerable': self.t('vulnerable'),
            'endangered': self.t('endangered'),
            'critically_endangered': self.t('critically_endangered'),
            'extinct_in_wild': self.t('extinct_in_wild'),
            'extinct': self.t('extinct')
        }
        return status_map.get(status, status)


def get_text(key, *args, **kwargs):
    """便捷函数：获取翻译文本"""
    return LocalizationManager().t(key, *args, **kwargs)
