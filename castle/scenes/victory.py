import pygame
from scenes.base_scene import BaseScene
from ui.components import Button, Panel, Label
from config import Colors, GameStates, SCREEN_WIDTH, SCREEN_HEIGHT

class VictoryScene(BaseScene):
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
        
        self.lbl_title = Label(center_x, 120, "胜利!", self.font_title, Colors.ACCENT_GOLD, centered=True)
        self.lbl_subtitle = Label(center_x, 200, "城堡已被摧毁", self.font_large, Colors.PARCHMENT, centered=True)
        
        self.btn_next = Button(
            center_x - btn_width // 2,
            start_y,
            btn_width, btn_height,
            "下一关",
            self.font_medium,
            action=self._next_level
        )
        
        self.btn_restart = Button(
            center_x - btn_width // 2,
            start_y + btn_spacing,
            btn_width, btn_height,
            "重新挑战",
            self.font_medium,
            action=self._restart
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
        self.game.data_manager.unlock_map('map_002')
        self.game.data_manager.unlock_map('map_003')
    
    def on_exit(self):
        pass
    
    def _next_level(self):
        self.game.change_state(GameStates.BATTLE)
    
    def _restart(self):
        self.game.change_state(GameStates.BATTLE)
    
    def _go_to_menu(self):
        self.game.change_state(GameStates.MENU)
    
    def handle_event(self, event):
        self.btn_next.handle_event(event)
        self.btn_restart.handle_event(event)
        self.btn_menu.handle_event(event)
    
    def update(self, dt):
        pass
    
    def render(self, surface):
        self.draw_background(surface)
        
        for i in range(50):
            x = (pygame.time.get_ticks() // 20 + i * 50) % SCREEN_WIDTH
            y = (pygame.time.get_ticks() // 30 + i * 30) % SCREEN_HEIGHT
            color = Colors.ACCENT_GOLD if i % 2 == 0 else Colors.PARCHMENT
            pygame.draw.circle(surface, color, (x, y), 2)
        
        self.lbl_title.render(surface)
        self.lbl_subtitle.render(surface)
        
        self.btn_next.render(surface)
        self.btn_restart.render(surface)
        self.btn_menu.render(surface)
