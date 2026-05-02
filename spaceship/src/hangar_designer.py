import pygame
import pymunk
import uuid
from typing import Dict, List, Tuple, Optional, Any
import numpy as np

from .config import SCREEN_WIDTH, SCREEN_HEIGHT, NEON_COLORS, MODULE_PRESETS
from .core import (
    Module, ShipDesign, PhysicsCalculator, DataManager,
    NeonRenderer, Button, InputBox, GameState
)


class HangarDesigner:
    def __init__(self, screen: pygame.Surface, clock: pygame.time.Clock):
        self.screen = screen
        self.clock = clock
        self.running = True
        self.next_state: Optional[GameState] = None
        
        self.font_large = pygame.font.Font(None, 48)
        self.font_medium = pygame.font.Font(None, 36)
        self.font_small = pygame.font.Font(None, 24)
        
        self.design_area_rect = pygame.Rect(250, 80, SCREEN_WIDTH - 500, SCREEN_HEIGHT - 200)
        self.grid_size = 20
        
        self.current_design: ShipDesign = ShipDesign(
            id=str(uuid.uuid4())[:8],
            name="新飞船",
            modules=[]
        )
        
        self.selected_module_idx: Optional[int] = None
        self.dragging_module: Optional[int] = None
        self.drag_offset = (0, 0)
        
        self.module_category = 'core'
        self.module_buttons: List[Button] = []
        
        self._init_buttons()
        
        self.design_name_input = InputBox(
            50, 50, 200, 35, 
            default_text=self.current_design.name,
            label="飞船名称"
        )
        
        self.message: Optional[str] = None
        self.message_timer = 0
    
    def _init_buttons(self):
        self.back_button = Button(
            SCREEN_WIDTH - 120, 20, 100, 40,
            "返回",
            color=NEON_COLORS['magenta']
        )
        
        self.save_button = Button(
            SCREEN_WIDTH - 240, 20, 100, 40,
            "保存",
            color=NEON_COLORS['green']
        )
        
        self.load_button = Button(
            SCREEN_WIDTH - 360, 20, 100, 40,
            "加载",
            color=NEON_COLORS['cyan']
        )
        
        self.clear_button = Button(
            SCREEN_WIDTH - 480, 20, 100, 40,
            "清空",
            color=NEON_COLORS['orange']
        )
        
        cat_x, cat_y = 20, 100
        cat_width, cat_height = 100, 40
        self.category_buttons = {
            'core': Button(cat_x, cat_y, cat_width, cat_height, "核心", color=NEON_COLORS['white']),
            'wings': Button(cat_x, cat_y + 50, cat_width, cat_height, "机翼", color=NEON_COLORS['cyan']),
            'engines': Button(cat_x, cat_y + 100, cat_width, cat_height, "引擎", color=NEON_COLORS['orange']),
            'weapons': Button(cat_x, cat_y + 150, cat_width, cat_height, "武器", color=NEON_COLORS['pink']),
        }
        
        self._update_module_buttons()
    
    def _update_module_buttons(self):
        self.module_buttons.clear()
        presets = MODULE_PRESETS.get(self.module_category, [])
        
        btn_y = 300
        for preset in presets:
            btn = Button(
                20, btn_y, 200, 50,
                preset['name'],
                color=preset['color']
            )
            btn.preset_data = preset
            self.module_buttons.append(btn)
            btn_y += 60
    
    def _show_message(self, text: str):
        self.message = text
        self.message_timer = 120
    
    def _save_design(self):
        self.current_design.name = self.design_name_input.text or "未命名飞船"
        DataManager.save_ship_design(self.current_design)
        self._show_message(f"已保存: {self.current_design.name}")
    
    def _load_design(self):
        designs = DataManager.list_ship_designs()
        if designs:
            design_id = designs[0]
            loaded = DataManager.load_ship_design(design_id)
            if loaded:
                self.current_design = loaded
                self.design_name_input.text = loaded.name
                self._show_message(f"已加载: {loaded.name}")
        else:
            self._show_message("没有找到保存的设计")
    
    def _clear_design(self):
        self.current_design = ShipDesign(
            id=str(uuid.uuid4())[:8],
            name="新飞船",
            modules=[]
        )
        self.design_name_input.text = "新飞船"
        self.selected_module_idx = None
        self._show_message("已清空设计")
    
    def _calculate_design_properties(self):
        if self.current_design.modules:
            mass, com, moi = PhysicsCalculator.calculate_ship_properties(self.current_design.modules)
            self.current_design.total_mass = mass
            self.current_design.center_of_mass = com
            self.current_design.moment_of_inertia = moi
    
    def _get_design_center(self) -> Tuple[float, float]:
        center_x = self.design_area_rect.centerx
        center_y = self.design_area_rect.centery
        return center_x, center_y
    
    def _screen_to_design(self, screen_pos: Tuple[int, int]) -> Tuple[float, float]:
        center_x, center_y = self._get_design_center()
        return (screen_pos[0] - center_x, screen_pos[1] - center_y)
    
    def _design_to_screen(self, design_pos: Tuple[float, float]) -> Tuple[int, int]:
        center_x, center_y = self._get_design_center()
        return (int(design_pos[0] + center_x), int(design_pos[1] + center_y))
    
    def _get_module_screen_rect(self, module: Module) -> pygame.Rect:
        screen_x, screen_y = self._design_to_screen((module.relative_x, module.relative_y))
        return pygame.Rect(
            screen_x - module.width / 2,
            screen_y - module.height / 2,
            module.width,
            module.height
        )
    
    def _hit_test_module(self, screen_pos: Tuple[int, int]) -> Optional[int]:
        for i, module in enumerate(self.current_design.modules):
            rect = self._get_module_screen_rect(module)
            if rect.collidepoint(screen_pos):
                return i
        return None
    
    def _add_module(self, preset_data: Dict):
        new_module = Module(
            id=str(uuid.uuid4())[:8],
            name=preset_data['name'],
            module_type=preset_data['module_type'],
            relative_x=0,
            relative_y=0,
            width=preset_data['width'],
            height=preset_data['height'],
            mass=preset_data['mass'],
            density=preset_data['density'],
            color=preset_data['color'],
            properties=preset_data.get('properties', {})
        )
        self.current_design.modules.append(new_module)
        self._calculate_design_properties()
        self._show_message(f"已添加: {new_module.name}")
    
    def _delete_selected_module(self):
        if self.selected_module_idx is not None:
            del self.current_design.modules[self.selected_module_idx]
            self.selected_module_idx = None
            self._calculate_design_properties()
            self._show_message("已删除模块")
    
    def handle_event(self, event: pygame.event.Event) -> bool:
        if event.type == pygame.QUIT:
            self.running = False
            return True
        
        if self.back_button.handle_event(event):
            self.next_state = GameState.MENU
            return True
        
        if self.save_button.handle_event(event):
            self._save_design()
            return True
        
        if self.load_button.handle_event(event):
            self._load_design()
            return True
        
        if self.clear_button.handle_event(event):
            self._clear_design()
            return True
        
        for cat, btn in self.category_buttons.items():
            if btn.handle_event(event):
                self.module_category = cat
                self._update_module_buttons()
                return True
        
        for btn in self.module_buttons:
            if btn.handle_event(event):
                self._add_module(btn.preset_data)
                return True
        
        self.design_name_input.handle_event(event)
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                hit_idx = self._hit_test_module(event.pos)
                if hit_idx is not None:
                    self.selected_module_idx = hit_idx
                    self.dragging_module = hit_idx
                    module = self.current_design.modules[hit_idx]
                    screen_x, screen_y = self._design_to_screen((module.relative_x, module.relative_y))
                    self.drag_offset = (event.pos[0] - screen_x, event.pos[1] - screen_y)
                elif self.design_area_rect.collidepoint(event.pos):
                    self.selected_module_idx = None
        
        elif event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1:
                self.dragging_module = None
        
        elif event.type == pygame.MOUSEMOTION:
            if self.dragging_module is not None:
                new_screen_pos = (
                    event.pos[0] - self.drag_offset[0],
                    event.pos[1] - self.drag_offset[1]
                )
                new_design_pos = self._screen_to_design(new_screen_pos)
                module = self.current_design.modules[self.dragging_module]
                module.relative_x = new_design_pos[0]
                module.relative_y = new_design_pos[1]
                self._calculate_design_properties()
        
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_DELETE or event.key == pygame.K_BACKSPACE:
                self._delete_selected_module()
        
        return False
    
    def update(self):
        self.design_name_input.update()
        
        if self.message_timer > 0:
            self.message_timer -= 1
            if self.message_timer <= 0:
                self.message = None
    
    def draw(self):
        self.screen.fill(NEON_COLORS['dark_bg'])
        
        pygame.draw.rect(self.screen, NEON_COLORS['menu_bg'], self.design_area_rect)
        NeonRenderer.draw_neon_rect(self.screen, self.design_area_rect, NEON_COLORS['cyan'], thickness=2)
        
        start_x = self.design_area_rect.x
        end_x = self.design_area_rect.x + self.design_area_rect.width
        start_y = self.design_area_rect.y
        end_y = self.design_area_rect.y + self.design_area_rect.height
        
        grid_color = (*NEON_COLORS['cyan'], 30)
        for x in range(start_x, end_x, self.grid_size):
            pygame.draw.line(self.screen, grid_color, (x, start_y), (x, end_y))
        for y in range(start_y, end_y, self.grid_size):
            pygame.draw.line(self.screen, grid_color, (start_x, y), (end_x, y))
        
        center_x, center_y = self._get_design_center()
        pygame.draw.line(self.screen, (*NEON_COLORS['white'], 50), 
                        (center_x, start_y), (center_x, end_y), 1)
        pygame.draw.line(self.screen, (*NEON_COLORS['white'], 50), 
                        (start_x, center_y), (end_x, center_y), 1)
        
        for i, module in enumerate(self.current_design.modules):
            rect = self._get_module_screen_rect(module)
            
            if i == self.selected_module_idx:
                pygame.draw.rect(self.screen, (*NEON_COLORS['magenta'], 40), rect.inflate(4, 4))
                NeonRenderer.draw_neon_rect(self.screen, rect.inflate(4, 4), NEON_COLORS['magenta'], thickness=3)
            
            pygame.draw.rect(self.screen, (*module.color, 40), rect)
            NeonRenderer.draw_neon_rect(self.screen, rect, module.color, thickness=2)
            
            name_surface = self.font_small.render(module.name, True, module.color)
            name_rect = name_surface.get_rect(center=rect.center)
            self.screen.blit(name_surface, name_rect)
        
        if self.current_design.modules:
            com_screen = self._design_to_screen(self.current_design.center_of_mass)
            NeonRenderer.draw_neon_circle(self.screen, com_screen, 8, NEON_COLORS['yellow'], thickness=2)
            cross_size = 12
            pygame.draw.line(self.screen, NEON_COLORS['yellow'],
                           (com_screen[0] - cross_size, com_screen[1]),
                           (com_screen[0] + cross_size, com_screen[1]), 2)
            pygame.draw.line(self.screen, NEON_COLORS['yellow'],
                           (com_screen[0], com_screen[1] - cross_size),
                           (com_screen[0], com_screen[1] + cross_size), 2)
        
        self.back_button.draw(self.screen, self.font_small)
        self.save_button.draw(self.screen, self.font_small)
        self.load_button.draw(self.screen, self.font_small)
        self.clear_button.draw(self.screen, self.font_small)
        
        for cat, btn in self.category_buttons.items():
            if cat == self.module_category:
                btn.is_hovered = True
            btn.draw(self.screen, self.font_small)
        
        for btn in self.module_buttons:
            btn.draw(self.screen, self.font_small)
        
        self.design_name_input.draw(self.screen, self.font_small)
        
        info_x = SCREEN_WIDTH - 220
        info_y = 100
        info_width = 200
        
        NeonRenderer.draw_neon_text(self.screen, "物理属性", self.font_medium,
                                    (info_x + info_width // 2, info_y),
                                    NEON_COLORS['cyan'])
        
        info_y += 50
        NeonRenderer.draw_neon_text(self.screen, f"总质量: {self.current_design.total_mass:.1f}", 
                                    self.font_small, (info_x, info_y), NEON_COLORS['white'], center=False)
        info_y += 30
        NeonRenderer.draw_neon_text(self.screen, f"模块数: {len(self.current_design.modules)}", 
                                    self.font_small, (info_x, info_y), NEON_COLORS['white'], center=False)
        info_y += 30
        NeonRenderer.draw_neon_text(self.screen, f"转动惯量: {self.current_design.moment_of_inertia:.1f}", 
                                    self.font_small, (info_x, info_y), NEON_COLORS['white'], center=False)
        
        info_y += 60
        NeonRenderer.draw_neon_text(self.screen, "操作提示", self.font_medium,
                                    (info_x + info_width // 2, info_y),
                                    NEON_COLORS['magenta'])
        info_y += 40
        hints = [
            "点击左侧模块添加",
            "拖动模块调整位置",
            "点击选中模块",
            "Delete删除模块",
            "保存后可在飞行中使用"
        ]
        for hint in hints:
            NeonRenderer.draw_neon_text(self.screen, hint, self.font_small,
                                        (info_x, info_y), NEON_COLORS['white'], center=False)
            info_y += 25
        
        if self.message and self.message_timer > 0:
            msg_surface = self.font_medium.render(self.message, True, NEON_COLORS['green'])
            msg_rect = msg_surface.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50))
            pygame.draw.rect(self.screen, (*NEON_COLORS['dark_bg'], 200), msg_rect.inflate(20, 10))
            self.screen.blit(msg_surface, msg_rect)
        
        NeonRenderer.draw_neon_text(self.screen, "机库设计器", self.font_large,
                                    (SCREEN_WIDTH // 2, 40), NEON_COLORS['cyan'])
    
    def run(self) -> Optional[GameState]:
        self.running = True
        self.next_state = None
        
        while self.running:
            for event in pygame.event.get():
                self.handle_event(event)
            
            self.update()
            self.draw()
            pygame.display.flip()
            self.clock.tick(60)
        
        return self.next_state
