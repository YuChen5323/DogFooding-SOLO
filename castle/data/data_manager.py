import json
import os
from config import Resources

class DataManager:
    def __init__(self):
        self.save_dir = os.path.join(os.path.dirname(__file__), '..', 'saves')
        self.map_dir = os.path.join(os.path.dirname(__file__), '..', 'maps')
        self._ensure_directories()
        
        self.player_data = self._load_player_data()
    
    def _ensure_directories(self):
        for directory in [self.save_dir, self.map_dir]:
            if not os.path.exists(directory):
                os.makedirs(directory)
    
    def _load_player_data(self):
        player_file = os.path.join(self.save_dir, 'player_data.json')
        if os.path.exists(player_file):
            try:
                with open(player_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        return {
            'unlocked_maps': ['map_001'],
            'resources': Resources.STARTING.copy(),
            'completed_maps': [],
            'high_scores': {}
        }
    
    def _save_player_data(self):
        player_file = os.path.join(self.save_dir, 'player_data.json')
        try:
            with open(player_file, 'w', encoding='utf-8') as f:
                json.dump(self.player_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving player data: {e}")
    
    def get_resources(self):
        return self.player_data.get('resources', Resources.STARTING.copy())
    
    def set_resources(self, resources):
        self.player_data['resources'] = resources
        self._save_player_data()
    
    def has_resources(self, cost):
        resources = self.get_resources()
        for res_name, amount in cost.items():
            if resources.get(res_name, 0) < amount:
                return False
        return True
    
    def spend_resources(self, cost):
        if not self.has_resources(cost):
            return False
        
        resources = self.get_resources()
        for res_name, amount in cost.items():
            resources[res_name] -= amount
        
        self.set_resources(resources)
        return True
    
    def add_resources(self, gains):
        resources = self.get_resources()
        for res_name, amount in gains.items():
            resources[res_name] = resources.get(res_name, 0) + amount
        self.set_resources(resources)
    
    def save_castle(self, name, blocks_data):
        save_data = {
            'name': name,
            'blocks': blocks_data,
            'created_at': self._get_timestamp()
        }
        
        filename = f"castle_{name}.json"
        filepath = os.path.join(self.save_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(save_data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving castle: {e}")
            return False
    
    def load_castle(self, name):
        filename = f"castle_{name}.json"
        filepath = os.path.join(self.save_dir, filename)
        
        if not os.path.exists(filepath):
            filepath = os.path.join(self.map_dir, filename)
            if not os.path.exists(filepath):
                return None
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading castle: {e}")
            return None
    
    def list_saved_castles(self):
        castles = []
        if os.path.exists(self.save_dir):
            for filename in os.listdir(self.save_dir):
                if filename.startswith('castle_') and filename.endswith('.json'):
                    name = filename[7:-5]
                    castles.append(name)
        return castles
    
    def list_maps(self):
        maps = []
        if os.path.exists(self.map_dir):
            for filename in os.listdir(self.map_dir):
                if filename.startswith('map_') and filename.endswith('.json'):
                    name = filename[:-5]
                    maps.append(name)
        return maps
    
    def get_unlocked_maps(self):
        return self.player_data.get('unlocked_maps', [])
    
    def unlock_map(self, map_name):
        unlocked = self.player_data.get('unlocked_maps', [])
        if map_name not in unlocked:
            unlocked.append(map_name)
            self.player_data['unlocked_maps'] = unlocked
            self._save_player_data()
            return True
        return False
    
    def complete_map(self, map_name, score=0):
        completed = self.player_data.get('completed_maps', [])
        if map_name not in completed:
            completed.append(map_name)
            self.player_data['completed_maps'] = completed
        
        if score > 0:
            high_scores = self.player_data.get('high_scores', {})
            if map_name not in high_scores or score > high_scores[map_name]:
                high_scores[map_name] = score
                self.player_data['high_scores'] = high_scores
        
        self._save_player_data()
    
    def save_game_state(self, state_name, state_data):
        filename = f"save_{state_name}.json"
        filepath = os.path.join(self.save_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(state_data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving game state: {e}")
            return False
    
    def load_game_state(self, state_name):
        filename = f"save_{state_name}.json"
        filepath = os.path.join(self.save_dir, filename)
        
        if not os.path.exists(filepath):
            return None
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading game state: {e}")
            return None
    
    def _get_timestamp(self):
        from datetime import datetime
        return datetime.now().isoformat()
    
    def create_default_maps(self):
        default_maps = [
            {
                'name': 'map_001',
                'display_name': '简易防御',
                'description': '基础城防训练',
                'unlocked': True,
                'blocks': [
                    {'type': 'STONE_BLOCK', 'grid_x': 15, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 16, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 17, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 15, 'grid_y': 14},
                    {'type': 'STONE_BLOCK', 'grid_x': 16, 'grid_y': 14},
                    {'type': 'STONE_BLOCK', 'grid_x': 17, 'grid_y': 14},
                    {'type': 'STONE_CORNER', 'grid_x': 15, 'grid_y': 13},
                    {'type': 'STONE_CORNER', 'grid_x': 17, 'grid_y': 13},
                ]
            },
            {
                'name': 'map_002',
                'display_name': '木石混合',
                'description': '利用木材加固',
                'unlocked': False,
                'blocks': [
                    {'type': 'STONE_BLOCK', 'grid_x': 14, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 15, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 16, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 17, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 18, 'grid_y': 15},
                    {'type': 'WOOD_BEAM', 'grid_x': 14, 'grid_y': 14},
                    {'type': 'WOOD_BEAM', 'grid_x': 16, 'grid_y': 14},
                    {'type': 'STONE_BLOCK', 'grid_x': 15, 'grid_y': 13},
                    {'type': 'STONE_BLOCK', 'grid_x': 17, 'grid_y': 13},
                    {'type': 'STONE_CORNER', 'grid_x': 14, 'grid_y': 12},
                    {'type': 'STONE_CORNER', 'grid_x': 18, 'grid_y': 12},
                ]
            },
            {
                'name': 'map_003',
                'display_name': '坚固堡垒',
                'description': '多层防御工事',
                'unlocked': False,
                'blocks': [
                    {'type': 'STONE_BLOCK', 'grid_x': 12, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 13, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 14, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 15, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 16, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 17, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 18, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 19, 'grid_y': 15},
                    {'type': 'STONE_BLOCK', 'grid_x': 12, 'grid_y': 14},
                    {'type': 'STONE_BLOCK', 'grid_x': 13, 'grid_y': 14},
                    {'type': 'WOOD_BEAM', 'grid_x': 14, 'grid_y': 14},
                    {'type': 'WOOD_BEAM', 'grid_x': 16, 'grid_y': 14},
                    {'type': 'STONE_BLOCK', 'grid_x': 18, 'grid_y': 14},
                    {'type': 'STONE_BLOCK', 'grid_x': 19, 'grid_y': 14},
                    {'type': 'STONE_BLOCK', 'grid_x': 12, 'grid_y': 13},
                    {'type': 'WOOD_FLOOR', 'grid_x': 13, 'grid_y': 13},
                    {'type': 'STONE_BLOCK', 'grid_x': 14, 'grid_y': 13},
                    {'type': 'STONE_BLOCK', 'grid_x': 15, 'grid_y': 13},
                    {'type': 'STONE_BLOCK', 'grid_x': 16, 'grid_y': 13},
                    {'type': 'STONE_BLOCK', 'grid_x': 17, 'grid_y': 13},
                    {'type': 'WOOD_FLOOR', 'grid_x': 18, 'grid_y': 13},
                    {'type': 'STONE_BLOCK', 'grid_x': 19, 'grid_y': 13},
                    {'type': 'STONE_CORNER', 'grid_x': 12, 'grid_y': 12},
                    {'type': 'STONE_BLOCK', 'grid_x': 15, 'grid_y': 12},
                    {'type': 'STONE_BLOCK', 'grid_x': 16, 'grid_y': 12},
                    {'type': 'STONE_CORNER', 'grid_x': 19, 'grid_y': 12},
                ]
            }
        ]
        
        for map_data in default_maps:
            filepath = os.path.join(self.map_dir, f"{map_data['name']}.json")
            if not os.path.exists(filepath):
                try:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        json.dump(map_data, f, indent=2, ensure_ascii=False)
                except Exception as e:
                    print(f"Error creating default map {map_data['name']}: {e}")
