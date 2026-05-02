#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
野生动物救助中心模拟经营游戏 - 游戏状态管理
"""

import random
import pickle
import os
from datetime import datetime, timedelta
from config import (
    GAME_BALANCE, ANIMAL_TYPES, INJURY_TYPES, SAVE_PATH, SAVE_VERSION,
    GAME_STATES
)
from database import DatabaseManager
from localization import LocalizationManager


class GameState:
    """游戏状态管理器"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.db = DatabaseManager()
        self.localization = LocalizationManager()
        
        self.current_state = 'menu'
        self.previous_state = 'menu'
        
        self.day = 1
        self.money = GAME_BALANCE['base_money']
        self.reputation = GAME_BALANCE['base_reputation']
        self.animal_capacity = GAME_BALANCE['base_animal_capacity']
        
        self.selected_animal_id = None
        self.selected_cage_id = None
        self.current_treatment = None
        self.current_training = None
        
        self.game_time = 0
        self.last_animal_rescue_time = 0
        self.tick_count = 0
        
        self.messages = []
        self.max_messages = 5
        
        self._initialized = True
    
    def new_game(self):
        """开始新游戏"""
        self.db.reset_database()
        
        self.day = 1
        self.money = GAME_BALANCE['base_money']
        self.reputation = GAME_BALANCE['base_reputation']
        self.animal_capacity = GAME_BALANCE['base_animal_capacity']
        
        self.selected_animal_id = None
        self.selected_cage_id = None
        self.game_time = 0
        self.last_animal_rescue_time = 0
        self.tick_count = 0
        self.messages = []
        
        self.current_state = 'game'
        self.add_message(self.localization.t('new_animal_arrived'), 'info')
    
    def load_game(self):
        """读取存档"""
        if not os.path.exists(SAVE_PATH):
            return False, self.localization.t('no_save_found')
        
        try:
            with open(SAVE_PATH, 'rb') as f:
                save_data = pickle.load(f)
            
            if save_data.get('version') != SAVE_VERSION:
                return False, '存档版本不兼容'
            
            self.day = save_data.get('day', 1)
            self.money = save_data.get('money', GAME_BALANCE['base_money'])
            self.reputation = save_data.get('reputation', GAME_BALANCE['base_reputation'])
            self.animal_capacity = save_data.get('animal_capacity', GAME_BALANCE['base_animal_capacity'])
            self.game_time = save_data.get('game_time', 0)
            self.last_animal_rescue_time = save_data.get('last_animal_rescue_time', 0)
            self.tick_count = save_data.get('tick_count', 0)
            
            self.current_state = 'game'
            return True, self.localization.t('load_successful')
            
        except Exception as e:
            return False, f'{self.localization.t("load_failed")}: {str(e)}'
    
    def save_game(self):
        """保存游戏"""
        try:
            save_dir = os.path.dirname(SAVE_PATH)
            if not os.path.exists(save_dir):
                os.makedirs(save_dir)
            
            save_data = {
                'version': SAVE_VERSION,
                'day': self.day,
                'money': self.money,
                'reputation': self.reputation,
                'animal_capacity': self.animal_capacity,
                'game_time': self.game_time,
                'last_animal_rescue_time': self.last_animal_rescue_time,
                'tick_count': self.tick_count,
                'saved_at': datetime.now().isoformat()
            }
            
            with open(SAVE_PATH, 'wb') as f:
                pickle.dump(save_data, f)
            
            self.db.update_game_state(
                day=self.day,
                money=self.money,
                reputation=self.reputation,
                animal_capacity=self.animal_capacity
            )
            
            return True, self.localization.t('save_successful')
            
        except Exception as e:
            return False, f'{self.localization.t("save_failed")}: {str(e)}'
    
    def has_save_game(self):
        """检查是否存在存档"""
        return os.path.exists(SAVE_PATH)
    
    def add_message(self, text, msg_type='info'):
        """添加消息提示"""
        self.messages.append({
            'text': text,
            'type': msg_type,
            'time': self.game_time
        })
        
        if len(self.messages) > self.max_messages:
            self.messages.pop(0)
    
    def update(self, dt):
        """更新游戏状态"""
        self.tick_count += 1
        self.game_time += dt
        
        self._update_animal_needs(dt)
        self._update_treatments(dt)
        self._check_new_animal_rescue()
        self._check_random_donation()
        
        if self.tick_count % 60 == 0:
            self._process_daily_events()
    
    def _update_animal_needs(self, dt):
        """更新动物需求"""
        animals = self.db.get_all_animals()
        
        for animal in animals:
            new_hunger = max(0, animal['hunger'] - GAME_BALANCE['animal_hunger_decay'] * dt / 60)
            new_happiness = max(0, animal['happiness'] - GAME_BALANCE['animal_happiness_decay'] * dt / 60)
            
            health_change = 0
            if new_hunger < 20:
                health_change -= 0.1 * dt / 60
            if new_happiness < 30:
                health_change -= 0.05 * dt / 60
            
            if animal['is_healthy'] and animal['is_treated']:
                health_change += GAME_BALANCE['health_recovery_rate'] * dt / 60
            
            new_health = max(0, min(100, animal['health'] + health_change))
            
            if new_health <= 0 and not animal['is_deceased']:
                self.db.update_animal(animal['id'], is_deceased=1)
                self.add_message(
                    f'{self.localization.translate_animal_type(animal["animal_type"])} {self.localization.t("deceased")}',
                    'error'
                )
                self.reputation = max(0, self.reputation - 5)
            
            self.db.update_animal(
                animal['id'],
                hunger=new_hunger,
                happiness=new_happiness,
                health=new_health
            )
    
    def _update_treatments(self, dt):
        """更新治疗进度"""
        active_treatments = self.db.get_active_treatments()
        
        for treatment in active_treatments:
            progress_increment = (100.0 / treatment['duration_hours']) * dt / 3600
            new_progress = min(100.0, treatment['progress'] + progress_increment)
            
            if new_progress >= 100.0:
                self.db.update_treatment(
                    treatment['id'],
                    progress=100.0,
                    is_active=0,
                    end_time=datetime.now().isoformat()
                )
                
                animal = self.db.get_animal(treatment['animal_id'])
                if animal:
                    injuries = self.db.get_animal_injuries(treatment['animal_id'], only_untreated=True)
                    for injury in injuries:
                        if treatment['treatment_type'] in ['bandage', 'medicine', 'surgery', 'iv_fluid']:
                            self.db.update_injury(injury['id'], treated=1, treatment_progress=100.0)
                    
                    untreated_injuries = self.db.get_animal_injuries(treatment['animal_id'], only_untreated=True)
                    if not untreated_injuries:
                        self.db.update_animal(treatment['animal_id'], is_treated=1)
                        self.add_message(
                            f'{self.localization.translate_animal_type(animal["animal_type"])} {self.localization.t("treatment_complete")}',
                            'success'
                        )
            else:
                self.db.update_treatment(treatment['id'], progress=new_progress)
    
    def _check_new_animal_rescue(self):
        """检查是否有新动物需要救助"""
        if self.game_time - self.last_animal_rescue_time >= GAME_BALANCE['rescue_new_animal_interval']:
            animals = self.db.get_all_animals()
            if len(animals) < self.animal_capacity:
                self._generate_random_animal()
                self.last_animal_rescue_time = self.game_time
    
    def _generate_random_animal(self):
        """生成随机动物"""
        total_prob = sum(animal['rescue_probability'] for animal in ANIMAL_TYPES.values())
        rand_value = random.uniform(0, total_prob)
        
        selected_type = 'rabbit'
        current_prob = 0
        for animal_type, config in ANIMAL_TYPES.items():
            current_prob += config['rescue_probability']
            if rand_value <= current_prob:
                selected_type = animal_type
                break
        
        animal_id = self.db.add_animal(selected_type)
        
        injury_count = random.randint(1, 3)
        injury_types = list(INJURY_TYPES.keys())
        selected_injuries = random.sample(injury_types, min(injury_count, len(injury_types)))
        
        for injury_type in selected_injuries:
            injury_config = INJURY_TYPES[injury_type]
            self.db.add_animal_injury(
                animal_id,
                injury_type,
                injury_config['severity']
            )
        
        animal = self.db.get_animal(animal_id)
        if animal:
            base_health = animal['health']
            health_reduction = len(selected_injuries) * 15 + random.randint(5, 15)
            new_health = max(20, base_health - health_reduction)
            self.db.update_animal(animal_id, health=new_health, is_healthy=0)
        
        self.add_message(
            f'{self.localization.t("new_animal_arrived")}: {self.localization.translate_animal_type(selected_type)}',
            'info'
        )
        
        return animal_id
    
    def _check_random_donation(self):
        """检查随机捐款"""
        if random.random() < 0.001:
            base_donation = 100 + int(self.reputation * 2)
            donation_amount = random.randint(base_donation // 2, base_donation * 2)
            
            donor_names = [
                '匿名爱心人士', '野生动物保护协会', '环保组织',
                '热心市民', '企业赞助', '学校团体'
            ]
            donor_name = random.choice(donor_names)
            
            reasons = [
                '支持救助工作', '表彰优秀救助', '帮助更多动物',
                '环境保护贡献', '野放成功奖励'
            ]
            reason = random.choice(reasons)
            
            self.money += donation_amount
            self.reputation = min(100, self.reputation + int(donation_amount / GAME_BALANCE['donation_reputation_multiplier']))
            
            self.db.add_donation(donation_amount, donor_name, reason)
            
            self.add_message(
                f'{donor_name} {self.localization.t("donation")} ¥{donation_amount}',
                'success'
            )
    
    def _process_daily_events(self):
        """处理日常事件"""
        pass
    
    def feed_animal(self, animal_id):
        """投喂动物"""
        animal = self.db.get_animal(animal_id)
        if not animal:
            return False, '动物不存在'
        
        if animal['hunger'] >= 90:
            return False, '动物不饿'
        
        feed_cost = 10
        if self.money < feed_cost:
            return False, '资金不足'
        
        self.money -= feed_cost
        
        new_hunger = min(100, animal['hunger'] + 30)
        new_happiness = min(100, animal['happiness'] + 5)
        
        self.db.update_animal(animal_id, hunger=new_hunger, happiness=new_happiness)
        self.db.add_activity_log(animal_id, 'feed', '投喂', 30)
        
        return True, '投喂成功'
    
    def select_animal(self, animal_id):
        """选择动物"""
        animal = self.db.get_animal(animal_id)
        if animal and not animal['is_released'] and not animal['is_deceased']:
            self.selected_animal_id = animal_id
            return True
        return False
    
    def get_selected_animal(self):
        """获取当前选中的动物"""
        if self.selected_animal_id:
            return self.db.get_animal(self.selected_animal_id)
        return None
    
    def start_treatment(self, animal_id, treatment_type):
        """开始治疗"""
        from config import TREATMENTS
        
        if treatment_type not in TREATMENTS:
            return False, '治疗类型无效'
        
        treatment_config = TREATMENTS[treatment_type]
        cost = treatment_config['cost']
        
        if self.money < cost:
            return False, self.localization.t('error') + ': 资金不足'
        
        self.money -= cost
        
        injuries = self.db.get_animal_injuries(animal_id)
        valid_treatment = False
        for injury in injuries:
            if injury['injury_type'] in treatment_config['applies_to']:
                valid_treatment = True
                break
        
        if not valid_treatment:
            self.money += cost
            return False, '该治疗不适用当前伤势'
        
        duration_hours = 24
        treatment_id = self.db.add_treatment(animal_id, treatment_type, duration_hours)
        
        animal = self.db.get_animal(animal_id)
        if animal:
            self.add_message(
                f'{self.localization.translate_animal_type(animal["animal_type"])} 开始{self.localization.t(treatment_type)}',
                'info'
            )
        
        return True, '治疗已开始'
    
    def start_training(self, animal_id, training_type):
        """开始训练"""
        from config import TRAINING_PROGRAMS
        
        animal = self.db.get_animal(animal_id)
        if not animal:
            return False, '动物不存在'
        
        if training_type not in TRAINING_PROGRAMS:
            return False, '训练类型无效'
        
        training_config = TRAINING_PROGRAMS[training_type]
        energy_cost = training_config['energy_cost']
        
        if animal['energy'] < energy_cost:
            return False, '动物体力不足'
        
        new_energy = animal['energy'] - energy_cost
        new_success_rate = min(0.95, animal['release_success_rate'] + training_config['success_rate_boost'])
        
        self.db.update_animal(animal_id, energy=new_energy, release_success_rate=new_success_rate)
        self.db.add_training_session(
            animal_id,
            training_type,
            training_config['success_rate_boost'],
            energy_cost
        )
        
        self.add_message(
            f'{self.localization.translate_animal_type(animal["animal_type"])} {self.localization.t("training_complete")}',
            'success'
        )
        
        return True, '训练完成'
    
    def release_animal(self, animal_id):
        """野放动物"""
        animal = self.db.get_animal(animal_id)
        if not animal:
            return False, '动物不存在'
        
        if animal['is_released']:
            return False, '动物已被野放'
        
        if not animal['is_healthy'] or not animal['is_treated']:
            return False, '动物尚未完全康复'
        
        location_x = random.uniform(-180, 180)
        location_y = random.uniform(-90, 90)
        
        self.db.release_animal(animal_id, location_x, location_y)
        
        if animal['cage_id']:
            self.db.update_cage(animal['cage_id'], is_occupied=0)
        
        success_chance = animal['release_success_rate']
        is_successful = random.random() < success_chance
        
        if is_successful:
            self.reputation = min(100, self.reputation + GAME_BALANCE['release_success_reputation'])
            self.add_message(
                f'{self.localization.translate_animal_type(animal["animal_type"])} {self.localization.t("release_to_wild")} {self.localization.t("success")}!',
                'success'
            )
            
            bonus_donation = int(ANIMAL_TYPES.get(animal['animal_type'], {}).get('value', 100) * 0.5)
            if bonus_donation > 0:
                self.money += bonus_donation
                self.db.add_donation(bonus_donation, '野放奖励', '成功野放动物奖金')
        else:
            self.reputation = max(0, self.reputation + GAME_BALANCE['release_failure_reputation'])
            self.add_message(
                f'{self.localization.translate_animal_type(animal["animal_type"])} {self.localization.t("release_to_wild")} {self.localization.t("warning")}...',
                'warning'
            )
        
        self.selected_animal_id = None
        
        return True, '野放完成'
    
    def set_language(self, lang_code):
        """设置语言"""
        return self.localization.set_language(lang_code)
    
    def get_current_language(self):
        """获取当前语言"""
        return self.localization.get_language()
    
    def change_state(self, new_state):
        """切换游戏状态"""
        if new_state in GAME_STATES:
            self.previous_state = self.current_state
            self.current_state = new_state
            return True
        return False
    
    def go_back(self):
        """返回上一状态"""
        self.current_state, self.previous_state = self.previous_state, self.current_state
    
    def get_all_animals(self):
        """获取所有动物"""
        return self.db.get_all_animals()
    
    def get_cages(self):
        """获取所有笼舍"""
        return self.db.get_cages()
    
    def get_release_statistics(self):
        """获取野放统计"""
        return self.db.get_release_statistics()
    
    def get_released_animals(self):
        """获取已野放动物"""
        return self.db.get_released_animals()
