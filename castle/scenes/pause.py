import pygame
from scenes.base_scene import BaseScene
from ui.components import Button, Panel, Label
from config import Colors, GameStates, SCREEN_WIDTH, SCREEN_HEIGHT

class PauseScene(BaseScene):
    def __init__(self, game):
        super().__init__(game)
        self._create_ui()
    
    def _create_ui(self):
        center_x = SCREEN_WIDTH // 2
        center_y = SCREEN_HEIGHT // 2
        
        self.overlay = Panel(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, bg_color=(*Colors.BACKGROUND[:3], 200), border_width=0)
        
        self.dialog = Panel(center_x - 200, center_y - 150, 400, 300, bg_color=Colors.PANEL)
        
        self.lbl_title = Label(center_x, center_y - 120, "游戏暂停", self.font_large, Colors.PARCHMENT, centered=True)
        
        btn_width = 200
        btn_height = 50
        btn_spacing = 70
        start_y = center_y - 30
        
        self.btn_resume = Button(
            center_x - btn_width // 2,
            start_y,
            btn_width, btn_height,
            "继续游戏",
            self.font_medium,
            action=self._resume
        )
        
        self.btn_restart = Button(
            center_x - btn_width // 2,
            start_y + btn_spacing,
            btn_width, btn_height,
            "重新开始",
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
        
        self.dialog.add_component(self.lbl_title)
        self.dialog.add_component(self.btn_resume)
        self.dialog.add_component(self.btn_restart)
        self.dialog.add_component(self.btn_menu)
    
    def on_enter(self):
        pass
    
    def on_exit(self):
        pass
    
    def _resume(self):
        self.game.change_state(GameStates.BATTLE)
    
    def _restart(self):
        self.game.change_state(GameStates.BATTLE)
    
    def _go_to_menu(self):
        self.game.change_state(GameStates.MENU)
    
    def handle_event(self, event):
        self.btn_resume.handle_event(event)
        self.btn_restart.handle_event(event)
        self.btn_menu.handle_event(event)
    
    def update(self, dt):
        pass
    
    def render(self, surface):
        overlay_surface = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay_surface.fill((*Colors.BACKGROUND[:3], 180))
        surface.blit(overlay_surface, (0, 0))
        
        self.dialog.render(surface)
        self.overlay.render(surface)
