import pygame
import pymunk
from scenes.base_scene import BaseScene
from ui.components import Button, Panel, SelectionGrid, Label, ResourceBar
from physics_engine import PhysicsEngine
from config import (
    Colors, GameStates, GRID_SIZE, GRID_COLS, GRID_ROWS,
    SCREEN_WIDTH, SCREEN_HEIGHT, BuildingTypes, GROUND_Y, Resources
)

class CastleEditor(BaseScene):
    def __init__(self, game):
        super().__init__(game)
        self.physics = None
        self.building_blocks = []
        self.selected_block_type = None
        self.grid_origin = (50, GROUND_Y - GRID_ROWS * GRID_SIZE)
        self.is_placing = False
        self.is_erasing = False
        self.current_castle_name = "untitled"
        self._create_ui()
    
    def _create_ui(self):
        self.top_panel = Panel(0, 0, SCREEN_WIDTH, 80, bg_color=Colors.PANEL, border_width=0)
        
        self.btn_back = Button(10, 10, 100, 40, "返回", self.font_small, action=self._go_back)
        self.btn_clear = Button(120, 10, 100, 40, "清除", self.font_small, action=self._clear_editor)
        self.btn_save = Button(230, 10, 100, 40, "保存", self.font_small, action=self._save_castle)
        self.btn_test = Button(340, 10, 100, 40, "测试", self.font_small, action=self._test_castle)
        
        self.lbl_mode = Label(460, 20, "模式: 放置", self.font_medium, Colors.PARCHMENT)
        
        self.resources = self.game.data_manager.get_resources()
        self.resource_bar = ResourceBar(SCREEN_WIDTH - 400, 10, 380, 60, self.resources, self.font_small)
        
        self.top_panel.add_component(self.btn_back)
        self.top_panel.add_component(self.btn_clear)
        self.top_panel.add_component(self.btn_save)
        self.top_panel.add_component(self.btn_test)
        self.top_panel.add_component(self.lbl_mode)
        self.top_panel.add_component(self.resource_bar)
        
        self.side_panel = Panel(SCREEN_WIDTH - 200, 80, 200, SCREEN_HEIGHT - 80, bg_color=Colors.PANEL)
        
        self.block_grid = SelectionGrid(SCREEN_WIDTH - 180, 100, 2, 4, 80, padding=10)
        
        block_types = [
            ('STONE_BLOCK', BuildingTypes.STONE_BLOCK),
            ('STONE_CORNER', BuildingTypes.STONE_CORNER),
            ('WOOD_BEAM', BuildingTypes.WOOD_BEAM),
            ('WOOD_FLOOR', BuildingTypes.WOOD_FLOOR),
        ]
        
        for key, block_data in block_types:
            surf = pygame.Surface((80, 80))
            surf.fill(Colors.DARK_IRON)
            block_surf = pygame.Surface((
                min(block_data['width'], 70),
                min(block_data['height'], 70)
            ))
            block_surf.fill(block_data['color'])
            surf.blit(block_surf, (5, 5))
            
            self.block_grid.add_item({'key': key, 'data': block_data}, surf)
        
        if self.block_grid.items:
            self.block_grid.selected_index = 0
            self.selected_block_type = self.block_grid.items[0]['data']
    
    def on_enter(self):
        self.physics = PhysicsEngine()
        self.building_blocks = []
        self.resources = self.game.data_manager.get_resources()
        self.resource_bar.update_resources(self.resources)
    
    def on_exit(self):
        self.physics = None
    
    def _go_back(self):
        self.game.change_state(GameStates.MENU)
    
    def _clear_editor(self):
        self.building_blocks = []
        self.physics = PhysicsEngine()
    
    def _save_castle(self):
        blocks_data = []
        for block in self.building_blocks:
            blocks_data.append({
                'type': block['type_key'],
                'grid_x': block['grid_x'],
                'grid_y': block['grid_y']
            })
        
        self.game.data_manager.save_castle(self.current_castle_name, blocks_data)
        self.lbl_mode.set_text("已保存!")
    
    def _test_castle(self):
        if self.building_blocks:
            self.game.change_state(GameStates.BATTLE)
    
    def _grid_to_world(self, grid_x, grid_y):
        world_x = self.grid_origin[0] + grid_x * GRID_SIZE + GRID_SIZE // 2
        world_y = self.grid_origin[1] + grid_y * GRID_SIZE + GRID_SIZE // 2
        return (world_x, world_y)
    
    def _world_to_grid(self, world_x, world_y):
        grid_x = int((world_x - self.grid_origin[0]) / GRID_SIZE)
        grid_y = int((world_y - self.grid_origin[1]) / GRID_SIZE)
        return (grid_x, grid_y)
    
    def _get_block_at_grid(self, grid_x, grid_y):
        for block in self.building_blocks:
            if block['grid_x'] == grid_x and block['grid_y'] == grid_y:
                return block
        return None
    
    def handle_event(self, event):
        self.top_panel.handle_event(event)
        self.side_panel.handle_event(event)
        self.block_grid.handle_event(event)
        
        selected = self.block_grid.get_selected_data()
        if selected:
            self.selected_block_type = selected['data']
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            mouse_pos = pygame.mouse.get_pos()
            
            if mouse_pos[0] < SCREEN_WIDTH - 200 and mouse_pos[1] > 80:
                if event.button == 1:
                    self.is_placing = True
                    self._try_place_block(mouse_pos)
                elif event.button == 3:
                    self.is_erasing = True
                    self._try_erase_block(mouse_pos)
        
        elif event.type == pygame.MOUSEBUTTONUP:
            self.is_placing = False
            self.is_erasing = False
        
        elif event.type == pygame.MOUSEMOTION:
            if self.is_placing:
                self._try_place_block(event.pos)
            elif self.is_erasing:
                self._try_erase_block(event.pos)
        
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_1:
                if len(self.block_grid.items) > 0:
                    self.block_grid.selected_index = 0
                    self.selected_block_type = self.block_grid.items[0]['data']
            elif event.key == pygame.K_2:
                if len(self.block_grid.items) > 1:
                    self.block_grid.selected_index = 1
                    self.selected_block_type = self.block_grid.items[1]['data']
            elif event.key == pygame.K_3:
                if len(self.block_grid.items) > 2:
                    self.block_grid.selected_index = 2
                    self.selected_block_type = self.block_grid.items[2]['data']
            elif event.key == pygame.K_4:
                if len(self.block_grid.items) > 3:
                    self.block_grid.selected_index = 3
                    self.selected_block_type = self.block_grid.items[3]['data']
            
            elif event.key == pygame.K_e:
                self.is_erasing = not self.is_erasing
                mode_text = "模式: 擦除" if self.is_erasing else "模式: 放置"
                self.lbl_mode.set_text(mode_text)
    
    def _try_place_block(self, mouse_pos):
        if not self.selected_block_type:
            return
        
        grid_x, grid_y = self._world_to_grid(mouse_pos[0], mouse_pos[1])
        
        if 0 <= grid_x < GRID_COLS and 0 <= grid_y < GRID_ROWS:
            existing = self._get_block_at_grid(grid_x, grid_y)
            if existing:
                return
            
            cost = self.selected_block_type.get('cost', {})
            if not self.game.data_manager.has_resources(cost):
                self.lbl_mode.set_text("资源不足!")
                return
            
            world_x, world_y = self._grid_to_world(grid_x, grid_y)
            
            width = self.selected_block_type['width']
            height = self.selected_block_type['height']
            
            body, shape = self.physics.add_building_block(
                world_x, world_y,
                width, height,
                self.selected_block_type['density'],
                self.selected_block_type['friction'],
                self.selected_block_type['elasticity'],
                self.selected_block_type['color'],
                self.selected_block_type['health'],
                self.selected_block_type['flammable']
            )
            
            if hasattr(self.selected_block_type, 'get') and self.selected_block_type.get('flammable'):
                shape.burn_time = self.selected_block_type.get('burn_time', 5000)
            
            self.game.data_manager.spend_resources(cost)
            self.resources = self.game.data_manager.get_resources()
            self.resource_bar.update_resources(self.resources)
            
            selected_data = self.block_grid.get_selected_data()
            type_key = selected_data['key'] if selected_data else 'STONE_BLOCK'
            
            self.building_blocks.append({
                'type_key': type_key,
                'grid_x': grid_x,
                'grid_y': grid_y,
                'body': body,
                'shape': shape
            })
    
    def _try_erase_block(self, mouse_pos):
        grid_x, grid_y = self._world_to_grid(mouse_pos[0], mouse_pos[1])
        
        block = self._get_block_at_grid(grid_x, grid_y)
        if block:
            self.physics.remove_object(block['shape'])
            self.building_blocks.remove(block)
    
    def update(self, dt):
        pass
    
    def render(self, surface):
        self.draw_background(surface)
        self.physics.render_ground(surface)
        
        self._draw_grid(surface)
        
        self.physics.render_objects(surface)
        
        self._draw_preview(surface)
        
        self.top_panel.render(surface)
        self.side_panel.render(surface)
        self.block_grid.render(surface)
        
        if self.block_grid.hovered_index >= 0:
            item = self.block_grid.items[self.block_grid.hovered_index]
            name = item['data']['data'].get('name', 'Unknown')
            info_surface = self.font_small.render(name, True, Colors.PARCHMENT)
            surface.blit(info_surface, (10, 90))
    
    def _draw_grid(self, surface):
        for x in range(GRID_COLS + 1):
            world_x = self.grid_origin[0] + x * GRID_SIZE
            pygame.draw.line(surface, Colors.MEDIUM_IRON, 
                           (world_x, self.grid_origin[1]),
                           (world_x, GROUND_Y), 1)
        
        for y in range(GRID_ROWS + 1):
            world_y = self.grid_origin[1] + y * GRID_SIZE
            pygame.draw.line(surface, Colors.MEDIUM_IRON,
                           (self.grid_origin[0], world_y),
                           (self.grid_origin[0] + GRID_COLS * GRID_SIZE, world_y), 1)
    
    def _draw_preview(self, surface):
        if not self.selected_block_type:
            return
        
        mouse_pos = pygame.mouse.get_pos()
        
        if mouse_pos[0] < SCREEN_WIDTH - 200 and mouse_pos[1] > 80:
            grid_x, grid_y = self._world_to_grid(mouse_pos[0], mouse_pos[1])
            
            if 0 <= grid_x < GRID_COLS and 0 <= grid_y < GRID_ROWS:
                world_x, world_y = self._grid_to_world(grid_x, grid_y)
                
                width = self.selected_block_type['width']
                height = self.selected_block_type['height']
                
                preview_rect = pygame.Rect(
                    world_x - width // 2,
                    world_y - height // 2,
                    width,
                    height
                )
                
                existing = self._get_block_at_grid(grid_x, grid_y)
                if existing or self.is_erasing:
                    color = Colors.ACCENT_RED
                else:
                    color = self.selected_block_type['color']
                
                s = pygame.Surface((width, height), pygame.SRCALPHA)
                s.fill((*color, 128))
                surface.blit(s, (preview_rect.x, preview_rect.y))
