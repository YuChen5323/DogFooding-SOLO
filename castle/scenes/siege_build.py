import pygame
from scenes.base_scene import BaseScene
from ui.components import Button, Panel, Label, SelectionGrid, ResourceBar, HealthBar
from config import Colors, GameStates, SiegeWeapons, Resources, SCREEN_WIDTH, SCREEN_HEIGHT

class SiegeBuild(BaseScene):
    def __init__(self, game):
        super().__init__(game)
        self.selected_weapon = None
        self.player_resources = Resources.STARTING.copy()
        self.built_weapons = []
        self._create_ui()
    
    def _create_ui(self):
        self.top_panel = Panel(0, 0, SCREEN_WIDTH, 80, bg_color=Colors.PANEL, border_width=0)
        
        self.btn_back = Button(10, 10, 100, 40, "返回", self.font_small, action=self._go_back)
        self.btn_start = Button(120, 10, 100, 40, "开始攻城", self.font_small, action=self._start_battle)
        
        self.lbl_title = Label(250, 20, "攻城器械搭建", self.font_medium, Colors.PARCHMENT)
        
        self.resource_bar = ResourceBar(SCREEN_WIDTH - 350, 10, 340, 60, self.player_resources, self.font_small)
        
        self.top_panel.add_component(self.btn_back)
        self.top_panel.add_component(self.btn_start)
        self.top_panel.add_component(self.lbl_title)
        self.top_panel.add_component(self.resource_bar)
        
        self.side_panel = Panel(SCREEN_WIDTH - 250, 80, 250, SCREEN_HEIGHT - 80, bg_color=Colors.PANEL)
        
        self.weapon_grid = SelectionGrid(SCREEN_WIDTH - 230, 100, 2, 2, 100, padding=10)
        
        weapons = [
            ('CATAPULT', SiegeWeapons.CATAPULT),
            ('FIRE_ARROW', SiegeWeapons.FIRE_ARROW),
            ('BATTERING_RAM', SiegeWeapons.BATTERING_RAM),
            ('SIEGE_TOWER', SiegeWeapons.SIEGE_TOWER),
        ]
        
        for key, weapon_data in weapons:
            surf = pygame.Surface((100, 100))
            surf.fill(Colors.DARK_IRON)
            weapon_surf = pygame.Surface((80, 80))
            weapon_surf.fill(weapon_data['color'])
            surf.blit(weapon_surf, (10, 10))
            
            name_surface = self.font_small.render(weapon_data['name'], True, Colors.PARCHMENT)
            surf.blit(name_surface, (10, 85))
            
            self.weapon_grid.add_item({'key': key, 'data': weapon_data}, surf)
        
        if self.weapon_grid.items:
            self.weapon_grid.selected_index = 0
            selected = self.weapon_grid.items[0]['data']
            self.selected_weapon = selected['data']
        
        self.btn_build = Button(SCREEN_WIDTH - 230, 350, 210, 50, "建造", self.font_medium, action=self._build_weapon)
        
        self.built_panel = Panel(SCREEN_WIDTH - 230, 420, 210, 250, bg_color=Colors.DARK_IRON)
        self.lbl_built = Label(SCREEN_WIDTH - 220, 430, "已建造:", self.font_small, Colors.PARCHMENT)
        self.built_panel.add_component(self.lbl_built)
    
    def on_enter(self):
        self.player_resources = self.game.data_manager.get_resources().copy()
        self.resource_bar.update_resources(self.player_resources)
        self.built_weapons = []
    
    def on_exit(self):
        pass
    
    def _go_back(self):
        self.game.change_state(GameStates.MENU)
    
    def _start_battle(self):
        self.game.change_state(GameStates.BATTLE)
    
    def _build_weapon(self):
        if not self.selected_weapon:
            return
        
        cost = self.selected_weapon.get('cost', {})
        
        for res_name, amount in cost.items():
            if self.player_resources.get(res_name, 0) < amount:
                return
        
        for res_name, amount in cost.items():
            if res_name in self.player_resources:
                self.player_resources[res_name] -= amount
        
        self.resource_bar.update_resources(self.player_resources)
        
        selected_data = self.weapon_grid.get_selected_data()
        weapon_key = selected_data['key'] if selected_data else 'CATAPULT'
        
        self.built_weapons.append({
            'key': weapon_key,
            'data': self.selected_weapon.copy()
        })
    
    def handle_event(self, event):
        self.top_panel.handle_event(event)
        self.side_panel.handle_event(event)
        self.weapon_grid.handle_event(event)
        self.btn_build.handle_event(event)
        self.built_panel.handle_event(event)
        
        selected = self.weapon_grid.get_selected_data()
        if selected:
            self.selected_weapon = selected['data']
    
    def update(self, dt):
        pass
    
    def render(self, surface):
        self.draw_background(surface)
        
        self.top_panel.render(surface)
        self.side_panel.render(surface)
        self.weapon_grid.render(surface)
        self.btn_build.render(surface)
        self.built_panel.render(surface)
        
        if self.weapon_grid.hovered_index >= 0:
            item = self.weapon_grid.items[self.weapon_grid.hovered_index]
            weapon_data = item['data']['data']
            
            name = weapon_data.get('name', 'Unknown')
            desc = weapon_data.get('description', '')
            cost = weapon_data.get('cost', {})
            
            y_offset = 90
            info_surface = self.font_small.render(f"名称: {name}", True, Colors.PARCHMENT)
            surface.blit(info_surface, (10, y_offset))
            y_offset += 25
            
            info_surface = self.font_small.render(f"描述: {desc}", True, Colors.PARCHMENT_DARK)
            surface.blit(info_surface, (10, y_offset))
            y_offset += 30
            
            for res_name, amount in cost.items():
                res_color = Resources.COLORS.get(res_name, Colors.TEXT)
                res_name_cn = Resources.NAMES.get(res_name, res_name)
                info_surface = self.font_small.render(f"{res_name_cn}: {amount}", True, res_color)
                surface.blit(info_surface, (10, y_offset))
                y_offset += 20
        
        if self.built_weapons:
            y = 460
            for i, weapon in enumerate(self.built_weapons[:8]):
                weapon_data = weapon['data']
                name = weapon_data.get('name', 'Unknown')
                color = weapon_data.get('color', Colors.STONE)
                
                pygame.draw.rect(surface, color, (SCREEN_WIDTH - 220, y, 30, 20), border_radius=2)
                name_surface = self.font_small.render(name, True, Colors.PARCHMENT)
                surface.blit(name_surface, (SCREEN_WIDTH - 185, y + 2))
                y += 28
