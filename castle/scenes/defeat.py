import pygame
from scenes.base_scene import BaseScene
from ui.components import Button, Panel, Label
from config import Colors, GameStates, SCREEN_WIDTH, SCREEN_HEIGHT

class DefeatScene(BaseScene):
    def __init__(self, game):
        super().__init__(game)
        self._create_ui()
    
    def _create_ui(self):
        center_x = SCREEN_WIDTH // 2
        center_y = SCREEN_HEIGHT // 2
        
        btn_width = 250
        btn_height = 50
        btn_spacing = 70
        start_y = center_y + 50
        
        self.lbl_title = Label(center_x, 120, "失败", self.font_title, Colors.ACCENT_RED, centered=True)
        self.lbl_subtitle = Label(center_x, 200, "城堡已被攻破", self.font_large, Colors.PARCHMENT, centered=True)
        
        self.btn_retry = Button(
            center_x - btn_width // 2,
            start_y,
            btn_width, btn_height,
            "重新尝试",
            self.font_medium,
            action=self._retry
        )
        
        self.btn_editor = Button(
            center_x - btn_width // 2,
            start_y + btn_spacing,
            btn_width, btn_height,
            "编辑城堡",
            self.font_medium,
            action=self._go_to_editor
        )
        
        self.btn_menu = Button(
            center_x - btn_width // 2,
            start_y + btn_spacing * 2,
            btn_width, btn_height,
            "返回主菜单",
            self.font_medium,
            action=self._go_to_menu
        )
    
    def on_enter(self):
        pass
    
    def on_exit(self):
        pass
    
    def _retry(self):
        self.game.change_state(GameStates.BATTLE)
    
    def _go_to_editor(self):
        self.game.change_state(GameStates.EDITOR)
    
    def _go_to_menu(self):
        self.game.change_state(GameStates.MENU)
    
    def handle_event(self, event):
        self.btn_retry.handle_event(event)
        self.btn_editor.handle_event(event)
        self.btn_menu.handle_event(event)
    
    def update(self, dt):
        pass
    
    def render(self, surface):
        self.draw_background(surface)
        
        overlay_surface = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay_surface.fill((*Colors.ACCENT_RED[:3], 50))
        surface.blit(overlay_surface, (0, 0))
        
        self.lbl_title.render(surface)
        self.lbl_subtitle.render(surface)
        
        self.btn_retry.render(surface)
        self.btn_editor.render(surface)
        self.btn_menu.render(surface)
