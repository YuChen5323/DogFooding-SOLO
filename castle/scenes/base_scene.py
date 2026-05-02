import pygame
from config import Colors, SCREEN_WIDTH, SCREEN_HEIGHT

class BaseScene:
    def __init__(self, game):
        self.game = game
        self.screen = game.screen
        self.font_large = None
        self.font_medium = None
        self.font_small = None
        self.font_title = None
        self._load_fonts()
    
    def _load_fonts(self):
        try:
            self.font_large = pygame.font.Font(None, 48)
            self.font_medium = pygame.font.Font(None, 32)
            self.font_small = pygame.font.Font(None, 24)
            self.font_title = pygame.font.Font(None, 72)
        except:
            self.font_large = pygame.font.SysFont('arial', 48)
            self.font_medium = pygame.font.SysFont('arial', 32)
            self.font_small = pygame.font.SysFont('arial', 24)
            self.font_title = pygame.font.SysFont('arial', 72)
    
    def on_enter(self):
        pass
    
    def on_exit(self):
        pass
    
    def handle_event(self, event):
        pass
    
    def update(self, dt):
        pass
    
    def render(self, surface):
        pass
    
    def draw_background(self, surface):
        surface.fill(Colors.BACKGROUND)
        sky_rect = pygame.Rect(0, 0, SCREEN_WIDTH, int(SCREEN_HEIGHT * 0.7))
        pygame.draw.rect(surface, Colors.SKY, sky_rect)
        
        for i in range(0, SCREEN_WIDTH, 100):
            pygame.draw.line(surface, Colors.DARK_IRON, (i, 0), (i, SCREEN_HEIGHT), 1)
        for i in range(0, SCREEN_HEIGHT, 100):
            pygame.draw.line(surface, Colors.DARK_IRON, (0, i), (SCREEN_WIDTH, i), 1)
    
    def draw_text_centered(self, surface, text, font, color, y_offset=0):
        text_surface = font.render(text, True, color)
        text_rect = text_surface.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + y_offset))
        surface.blit(text_surface, text_rect)
