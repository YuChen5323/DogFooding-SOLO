import pygame
from scenes.base_scene import BaseScene
from ui.components import Button, Panel, Label
from config import Colors, GameStates, SCREEN_WIDTH, SCREEN_HEIGHT

class MainMenu(BaseScene):
    def __init__(self, game):
        super().__init__(game)
        self._create_ui()
    
    def _create_ui(self):
        center_x = SCREEN_WIDTH // 2
        center_y = SCREEN_HEIGHT // 2
        
        btn_width = 300
        btn_height = 60
        btn_spacing = 80
        start_y = center_y - 50
        
        self.btn_editor = Button(
            center_x - btn_width // 2,
            start_y,
            btn_width, btn_height,
            "城堡编辑器",
            self.font_medium,
            action=self._go_to_editor
        )
        
        self.btn_siege = Button(
            center_x - btn_width // 2,
            start_y + btn_spacing,
            btn_width, btn_height,
            "攻城模式",
            self.font_medium,
            action=self._go_to_siege
        )
        
        self.btn_defense = Button(
            center_x - btn_width // 2,
            start_y + btn_spacing * 2,
            btn_width, btn_height,
            "守城战役",
            self.font_medium,
            action=self._go_to_defense
        )
        
        self.btn_quit = Button(
            center_x - btn_width // 2,
            start_y + btn_spacing * 3,
            btn_width, btn_height,
            "退出游戏",
            self.font_medium,
            action=self._quit_game
        )
    
    def on_enter(self):
        pass
    
    def on_exit(self):
        pass
    
    def _go_to_editor(self):
        self.game.change_state(GameStates.EDITOR)
    
    def _go_to_siege(self):
        self.game.change_state(GameStates.SIEGE_BUILD)
    
    def _go_to_defense(self):
        self.game.change_state(GameStates.BATTLE)
    
    def _quit_game(self):
        self.game.running = False
    
    def handle_event(self, event):
        self.btn_editor.handle_event(event)
        self.btn_siege.handle_event(event)
        self.btn_defense.handle_event(event)
        self.btn_quit.handle_event(event)
    
    def update(self, dt):
        pass
    
    def render(self, surface):
        self.draw_background(surface)
        
        title_surface = self.font_title.render("城堡围攻", True, Colors.PARCHMENT)
        subtitle_surface = self.font_medium.render("Castle Siege Simulator", True, Colors.PARCHMENT_DARK)
        
        title_rect = title_surface.get_rect(center=(SCREEN_WIDTH // 2, 100))
        subtitle_rect = subtitle_surface.get_rect(center=(SCREEN_WIDTH // 2, 160))
        
        surface.blit(title_surface, title_rect)
        surface.blit(subtitle_surface, subtitle_rect)
        
        self.btn_editor.render(surface)
        self.btn_siege.render(surface)
        self.btn_defense.render(surface)
        self.btn_quit.render(surface)
        
        version_surface = self.font_small.render("v1.0 - 中世纪物理破坏模拟", True, Colors.TEXT_DARK)
        surface.blit(version_surface, (10, SCREEN_HEIGHT - 30))
