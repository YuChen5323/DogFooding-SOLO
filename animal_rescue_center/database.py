#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
野生动物救助中心模拟经营游戏 - 数据库管理
"""

import sqlite3
import os
import json
from datetime import datetime
from config import DB_PATH, ANIMAL_TYPES, INJURY_TYPES, TREATMENTS, TRAINING_PROGRAMS


class DatabaseManager:
    """数据库管理器"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.db_path = DB_PATH
        self._ensure_data_directory()
        self._initialize_database()
        self._initialized = True
    
    def _ensure_data_directory(self):
        """确保数据目录存在"""
        data_dir = os.path.dirname(self.db_path)
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
    
    def _get_connection(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _initialize_database(self):
        """初始化数据库表结构"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS game_state (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                day INTEGER DEFAULT 1,
                money INTEGER DEFAULT 5000,
                reputation INTEGER DEFAULT 50,
                animal_capacity INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS animals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_type TEXT NOT NULL,
                name TEXT,
                health INTEGER DEFAULT 100,
                hunger INTEGER DEFAULT 100,
                happiness INTEGER DEFAULT 50,
                energy INTEGER DEFAULT 100,
                release_success_rate REAL DEFAULT 0.5,
                is_healthy INTEGER DEFAULT 0,
                is_treated INTEGER DEFAULT 0,
                is_trained INTEGER DEFAULT 0,
                is_released INTEGER DEFAULT 0,
                is_deceased INTEGER DEFAULT 0,
                cage_id INTEGER,
                arrived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                released_at TIMESTAMP,
                FOREIGN KEY (cage_id) REFERENCES cages (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS animal_injuries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id INTEGER NOT NULL,
                injury_type TEXT NOT NULL,
                severity TEXT DEFAULT 'medium',
                diagnosed INTEGER DEFAULT 0,
                treated INTEGER DEFAULT 0,
                treatment_progress REAL DEFAULT 0.0,
                FOREIGN KEY (animal_id) REFERENCES animals (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blood_tests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id INTEGER NOT NULL,
                white_blood_cells REAL,
                red_blood_cells REAL,
                platelets REAL,
                glucose REAL,
                test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (animal_id) REFERENCES animals (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cage_number INTEGER NOT NULL,
                temperature REAL DEFAULT 22.0,
                humidity REAL DEFAULT 60.0,
                is_occupied INTEGER DEFAULT 0,
                notes TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS treatments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id INTEGER NOT NULL,
                treatment_type TEXT NOT NULL,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                duration_hours INTEGER,
                is_active INTEGER DEFAULT 1,
                progress REAL DEFAULT 0.0,
                FOREIGN KEY (animal_id) REFERENCES animals (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS training_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id INTEGER NOT NULL,
                training_type TEXT NOT NULL,
                session_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                success_rate_boost REAL,
                energy_cost INTEGER,
                completed INTEGER DEFAULT 0,
                FOREIGN KEY (animal_id) REFERENCES animals (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS released_animals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id INTEGER NOT NULL,
                release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                location_x REAL,
                location_y REAL,
                is_alive INTEGER DEFAULT 1,
                last_check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                survival_days INTEGER DEFAULT 0,
                FOREIGN KEY (animal_id) REFERENCES animals (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id INTEGER,
                log_type TEXT NOT NULL,
                message TEXT,
                value REAL,
                log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (animal_id) REFERENCES animals (id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount INTEGER NOT NULL,
                donor_name TEXT,
                reason TEXT,
                donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('SELECT COUNT(*) FROM game_state')
        if cursor.fetchone()[0] == 0:
            cursor.execute('INSERT INTO game_state (day, money, reputation, animal_capacity) VALUES (1, 5000, 50, 10)')
            
            for i in range(10):
                cursor.execute('INSERT INTO cages (cage_number, temperature, humidity, is_occupied) VALUES (?, 22.0, 60.0, 0)', (i + 1,))
        
        conn.commit()
        conn.close()
    
    def reset_database(self):
        """重置数据库（新游戏）"""
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
        self._initialize_database()
    
    def get_game_state(self):
        """获取游戏状态"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM game_state WHERE id = 1')
        result = cursor.fetchone()
        conn.close()
        return dict(result) if result else None
    
    def update_game_state(self, **kwargs):
        """更新游戏状态"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        set_clauses = []
        values = []
        for key, value in kwargs.items():
            set_clauses.append(f'{key} = ?')
            values.append(value)
        
        set_clauses.append('updated_at = CURRENT_TIMESTAMP')
        values.append(1)
        
        query = f'UPDATE game_state SET {", ".join(set_clauses)} WHERE id = ?'
        cursor.execute(query, values)
        conn.commit()
        conn.close()
    
    def add_animal(self, animal_type, name=None):
        """添加新动物"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        animal_config = ANIMAL_TYPES.get(animal_type, {})
        base_health = animal_config.get('base_health', 100)
        base_hunger = animal_config.get('base_hunger', 100)
        base_happiness = animal_config.get('base_happiness', 50)
        
        cursor.execute('''
            INSERT INTO animals (animal_type, name, health, hunger, happiness, energy, release_success_rate)
            VALUES (?, ?, ?, ?, ?, 100, 0.5)
        ''', (animal_type, name or animal_type, base_health, base_hunger, base_happiness))
        
        animal_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return animal_id
    
    def get_animal(self, animal_id):
        """获取动物信息"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM animals WHERE id = ?', (animal_id,))
        result = cursor.fetchone()
        conn.close()
        return dict(result) if result else None
    
    def get_all_animals(self, include_released=False, include_deceased=False):
        """获取所有动物"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        conditions = ['1=1']
        params = []
        
        if not include_released:
            conditions.append('is_released = 0')
        if not include_deceased:
            conditions.append('is_deceased = 0')
        
        query = f'SELECT * FROM animals WHERE {" AND ".join(conditions)}'
        cursor.execute(query, params)
        results = cursor.fetchall()
        conn.close()
        return [dict(row) for row in results]
    
    def update_animal(self, animal_id, **kwargs):
        """更新动物信息"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        set_clauses = []
        values = []
        for key, value in kwargs.items():
            set_clauses.append(f'{key} = ?')
            values.append(value)
        
        values.append(animal_id)
        query = f'UPDATE animals SET {", ".join(set_clauses)} WHERE id = ?'
        cursor.execute(query, values)
        conn.commit()
        conn.close()
    
    def add_animal_injury(self, animal_id, injury_type, severity='medium'):
        """添加动物伤势"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO animal_injuries (animal_id, injury_type, severity, diagnosed, treated, treatment_progress)
            VALUES (?, ?, ?, 0, 0, 0.0)
        ''', (animal_id, injury_type, severity))
        injury_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return injury_id
    
    def get_animal_injuries(self, animal_id, only_untreated=False):
        """获取动物的伤势"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        conditions = ['animal_id = ?']
        params = [animal_id]
        
        if only_untreated:
            conditions.append('treated = 0')
        
        query = f'SELECT * FROM animal_injuries WHERE {" AND ".join(conditions)}'
        cursor.execute(query, params)
        results = cursor.fetchall()
        conn.close()
        return [dict(row) for row in results]
    
    def update_injury(self, injury_id, **kwargs):
        """更新伤势信息"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        set_clauses = []
        values = []
        for key, value in kwargs.items():
            set_clauses.append(f'{key} = ?')
            values.append(value)
        
        values.append(injury_id)
        query = f'UPDATE animal_injuries SET {", ".join(set_clauses)} WHERE id = ?'
        cursor.execute(query, values)
        conn.commit()
        conn.close()
    
    def add_blood_test(self, animal_id, white_blood_cells, red_blood_cells, platelets, glucose):
        """添加血液化验记录"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO blood_tests (animal_id, white_blood_cells, red_blood_cells, platelets, glucose)
            VALUES (?, ?, ?, ?, ?)
        ''', (animal_id, white_blood_cells, red_blood_cells, platelets, glucose))
        test_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return test_id
    
    def get_cages(self, only_available=False):
        """获取笼舍信息"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        if only_available:
            cursor.execute('SELECT * FROM cages WHERE is_occupied = 0')
        else:
            cursor.execute('SELECT * FROM cages')
        
        results = cursor.fetchall()
        conn.close()
        return [dict(row) for row in results]
    
    def get_cage(self, cage_id):
        """获取单个笼舍信息"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM cages WHERE id = ?', (cage_id,))
        result = cursor.fetchone()
        conn.close()
        return dict(result) if result else None
    
    def update_cage(self, cage_id, **kwargs):
        """更新笼舍信息"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        set_clauses = []
        values = []
        for key, value in kwargs.items():
            set_clauses.append(f'{key} = ?')
            values.append(value)
        
        values.append(cage_id)
        query = f'UPDATE cages SET {", ".join(set_clauses)} WHERE id = ?'
        cursor.execute(query, values)
        conn.commit()
        conn.close()
    
    def assign_animal_to_cage(self, animal_id, cage_id):
        """将动物分配到笼舍"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE cages SET is_occupied = 1 WHERE id = ?', (cage_id,))
        cursor.execute('UPDATE animals SET cage_id = ? WHERE id = ?', (cage_id, animal_id))
        
        conn.commit()
        conn.close()
    
    def add_treatment(self, animal_id, treatment_type, duration_hours):
        """开始治疗"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO treatments (animal_id, treatment_type, duration_hours, is_active, progress)
            VALUES (?, ?, ?, 1, 0.0)
        ''', (animal_id, treatment_type, duration_hours))
        treatment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return treatment_id
    
    def get_active_treatments(self, animal_id=None):
        """获取进行中的治疗"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        if animal_id:
            cursor.execute('SELECT * FROM treatments WHERE animal_id = ? AND is_active = 1', (animal_id,))
        else:
            cursor.execute('SELECT * FROM treatments WHERE is_active = 1')
        
        results = cursor.fetchall()
        conn.close()
        return [dict(row) for row in results]
    
    def update_treatment(self, treatment_id, **kwargs):
        """更新治疗进度"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        set_clauses = []
        values = []
        for key, value in kwargs.items():
            set_clauses.append(f'{key} = ?')
            values.append(value)
        
        values.append(treatment_id)
        query = f'UPDATE treatments SET {", ".join(set_clauses)} WHERE id = ?'
        cursor.execute(query, values)
        conn.commit()
        conn.close()
    
    def add_training_session(self, animal_id, training_type, success_rate_boost, energy_cost):
        """添加训练记录"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO training_sessions (animal_id, training_type, success_rate_boost, energy_cost, completed)
            VALUES (?, ?, ?, ?, 1)
        ''', (animal_id, training_type, success_rate_boost, energy_cost))
        session_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return session_id
    
    def get_training_history(self, animal_id):
        """获取训练历史"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM training_sessions 
            WHERE animal_id = ? AND completed = 1
            ORDER BY session_date DESC
        ''', (animal_id,))
        results = cursor.fetchall()
        conn.close()
        return [dict(row) for row in results]
    
    def release_animal(self, animal_id, location_x, location_y):
        """野放动物"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE animals SET is_released = 1, released_at = CURRENT_TIMESTAMP WHERE id = ?', (animal_id,))
        
        cursor.execute('''
            INSERT INTO released_animals (animal_id, location_x, location_y, is_alive, survival_days)
            VALUES (?, ?, ?, 1, 0)
        ''', (animal_id, location_x, location_y))
        
        released_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return released_id
    
    def get_released_animals(self):
        """获取已野放动物"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM released_animals')
        results = cursor.fetchall()
        conn.close()
        return [dict(row) for row in results]
    
    def update_released_animal(self, released_id, **kwargs):
        """更新野放动物状态"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        set_clauses = []
        values = []
        for key, value in kwargs.items():
            set_clauses.append(f'{key} = ?')
            values.append(value)
        
        values.append(released_id)
        query = f'UPDATE released_animals SET {", ".join(set_clauses)} WHERE id = ?'
        cursor.execute(query, values)
        conn.commit()
        conn.close()
    
    def add_activity_log(self, animal_id, log_type, message=None, value=None):
        """添加活动日志"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO activity_logs (animal_id, log_type, message, value)
            VALUES (?, ?, ?, ?)
        ''', (animal_id, log_type, message, value))
        log_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return log_id
    
    def get_activity_logs(self, animal_id, log_type=None, limit=50):
        """获取活动日志"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        conditions = ['animal_id = ?']
        params = [animal_id]
        
        if log_type:
            conditions.append('log_type = ?')
            params.append(log_type)
        
        query = f'''
            SELECT * FROM activity_logs 
            WHERE {" AND ".join(conditions)}
            ORDER BY log_time DESC
            LIMIT ?
        '''
        params.append(limit)
        cursor.execute(query, params)
        results = cursor.fetchall()
        conn.close()
        return [dict(row) for row in results]
    
    def add_donation(self, amount, donor_name=None, reason=None):
        """添加捐款记录"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO donations (amount, donor_name, reason)
            VALUES (?, ?, ?)
        ''', (amount, donor_name, reason))
        donation_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return donation_id
    
    def get_total_donations(self):
        """获取总捐款金额"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT SUM(amount) FROM donations')
        result = cursor.fetchone()[0] or 0
        conn.close()
        return result
    
    def get_release_statistics(self):
        """获取野放统计"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM released_animals')
        total_released = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM released_animals WHERE is_alive = 1')
        alive = cursor.fetchone()[0]
        
        cursor.execute('SELECT AVG(survival_days) FROM released_animals')
        avg_survival = cursor.fetchone()[0] or 0
        
        conn.close()
        
        survival_rate = (alive / total_released * 100) if total_released > 0 else 0
        
        return {
            'total_released': total_released,
            'alive': alive,
            'deceased': total_released - alive,
            'survival_rate': survival_rate,
            'avg_survival_days': avg_survival
        }
