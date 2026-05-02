import pygame
import pymunk
import sys
import os
import math
from typing import Dict, List, Tuple, Optional, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import SCREEN_WIDTH, SCREEN_HEIGHT, NEON_COLORS, FPS
from src.core import GameState, NeonRenderer, Button
from src.hangar_designer import HangarDesigner
from src.training_mode import TrainingMode
from src.formation_editor import FormationEditor
from src.playback_mode import PlaybackMode


class MainMenu:
    def __init__(self, screen: pygame.Surface, clock: pygame.time.Clock):
        self.screen = screen
        self.clock = clock
        self.running = True
        self.next_state: Optional[GameState] = None
        
        self.font_large = pygame.font.Font(None, 72)
        self.font_medium = pygame.font.Font(None, 48)
        self.font_small = pygame.font.Font(None, 32)
        
        self.button_width = 300
        self.button_height = 60
        self.button_spacing = 80
        self.button_x = (SCREEN_WIDTH - self.button_width) // 2
        self.button_start_y = 250
        
        self.menu_items = [
            ("机库设计器", GameState.HANGAR, NEON_COLORS['cyan']),
            ("飞行训练", GameState.TRAINING, NEON_COLORS['green']),
            ("编队编辑器", GameState.FORMATION_EDITOR, NEON_COLORS['yellow']),
            ("表演回放", GameState.PLAYBACK, NEON_COLORS['magenta']),
            ("退出游戏", GameState.EXIT, NEON_COLORS['orange']),
        ]
        
        self.buttons: List[Button] = []
        for i, (text, state, color) in enumerate(self.menu_items):
            btn_y = self.button_start_y + i * self.button_spacing
            btn = Button(
                self.button_x, btn_y,
                self.button_width, self.button_height,
                text, color=color
            )
            btn.target_state = state
            self.buttons.append(btn)
        
        self.title_offset = 0.0
        self.particle_timer = 0
        self.background_particles = self._init_background_particles()
    
    def _init_background_particles(self) -> List[Dict]:
        particles = []
        for _ in range(100):
            particles.append({
                'x': float(int(os.urandom(4).hex(), 16) % SCREEN_WIDTH),
                'y': float(int(os.urandom(4).hex(), 16) % SCREEN_HEIGHT),
                'size': float(int(os.urandom(2).hex(), 16) % 3 + 1),
                'speed_x': float(int(os.urandom(2).hex(), 16) % 100 - 50) / 50.0,
                'speed_y': float(int(os.urandom(2).hex(), 16) % 100 - 50) / 50.0,
                'brightness': float(int(os.urandom(2).hex(), 16) % 100 + 100),
            })
        return particles
    
    def _update_particles(self):
        for particle in self.background_particles:
            particle['x'] += particle['speed_x']
            particle['y'] += particle['speed_y']
            
            if particle['x'] < 0:
                particle['x'] = SCREEN_WIDTH
            elif particle['x'] > SCREEN_WIDTH:
                particle['x'] = 0
            
            if particle['y'] < 0:
                particle['y'] = SCREEN_HEIGHT
            elif particle['y'] > SCREEN_HEIGHT:
                particle['y'] = 0
    
    def _draw_particles(self):
        for particle in self.background_particles:
            color = (
                int(particle['brightness']),
                int(particle['brightness'] * 0.8),
                int(particle['brightness'] * 1.2)
            )
            pygame.draw.circle(self.screen, color,
                             (int(particle['x']), int(particle['y'])),
                             int(particle['size']))
    
    def _draw_grid(self):
        grid_size = 50
        alpha = 30
        
        for x in range(0, SCREEN_WIDTH, grid_size):
            pygame.draw.line(self.screen, (*NEON_COLORS['cyan'], alpha),
                           (x, 0), (x, SCREEN_HEIGHT), 1)
        for y in range(0, SCREEN_HEIGHT, grid_size):
            pygame.draw.line(self.screen, (*NEON_COLORS['cyan'], alpha),
                           (0, y), (SCREEN_WIDTH, y), 1)
    
    def _draw_title(self):
        title_text = "太空飞船"
        subtitle_text = "2D 物理飞船游戏"
        
        self.title_offset += 0.02
        wave_offset = math.sin(self.title_offset) * 5
        
        title_y = 100 + wave_offset
        NeonRenderer.draw_neon_text(
            self.screen, title_text,
            self.font_large,
            (SCREEN_WIDTH // 2, title_y),
            NEON_COLORS['cyan']
        )
        
        subtitle_y = 170 + wave_offset
        NeonRenderer.draw_neon_text(
            self.screen, subtitle_text,
            self.font_medium,
            (SCREEN_WIDTH // 2, subtitle_y),
            NEON_COLORS['magenta']
        )
    
    def _draw_decorative_ships(self):
        time = pygame.time.get_ticks() / 1000.0
        
        colors = [NEON_COLORS['cyan'], NEON_COLORS['magenta'], NEON_COLORS['yellow']]
        
        for i, color in enumerate(colors):
            angle = time * 0.5 + i * 2.1
            radius = 150 + i * 40
            
            x = SCREEN_WIDTH // 2 + math.cos(angle) * radius
            y = SCREEN_HEIGHT // 2 + math.sin(angle) * radius
            
            size = 15 - i * 2
            points = [
                (0, -size),
                (size * 0.7, size),
                (0, size * 0.5),
                (-size * 0.7, size)
            ]
            
            rotated_points = []
            for px, py in points:
                cos_a = math.cos(angle)
                sin_a = math.sin(angle)
                rx = px * cos_a - py * sin_a
                ry = px * sin_a + py * cos_a
                rotated_points.append((int(x + rx), int(y + ry)))
            
            pygame.draw.polygon(self.screen, (*color, 30), rotated_points)
            
            for j in range(len(rotated_points)):
                start = rotated_points[j]
                end = rotated_points[(j + 1) % len(rotated_points)]
                pygame.draw.line(self.screen, (*color, 80), start, end, 1)
    
    def handle_event(self, event: pygame.event.Event) -> bool:
        if event.type == pygame.QUIT:
            self.running = False
            self.next_state = GameState.EXIT
            return True
        
        for btn in self.buttons:
            if btn.handle_event(event):
                self.next_state = btn.target_state
                self.running = False
                return True
        
        return False
    
    def update(self):
        self._update_particles()
    
    def draw(self):
        self.screen.fill(NEON_COLORS['dark_bg'])
        
        self._draw_grid()
        self._draw_particles()
        self._draw_decorative_ships()
        self._draw_title()
        
        for btn in self.buttons:
            btn.draw(self.screen, self.font_medium)
        
        version_text = "v1.0 - 霓虹未来主义"
        NeonRenderer.draw_neon_text(
            self.screen, version_text,
            self.font_small,
            (SCREEN_WIDTH - 100, SCREEN_HEIGHT - 30),
            NEON_COLORS['white']
        )
    
    def run(self) -> Optional[GameState]:
        self.running = True
        self.next_state = None
        
        while self.running:
            for event in pygame.event.get():
                self.handle_event(event)
            
            self.update()
            self.draw()
            pygame.display.flip()
            self.clock.tick(FPS)
        
        return self.next_state


class Game:
    def __init__(self):
        pygame.init()
        pygame.mixer.init()
        
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("太空飞船 - 2D物理飞船游戏")
        
        self.clock = pygame.time.Clock()
        
        self.current_state: GameState = GameState.MENU
    
    def run(self):
        while self.current_state != GameState.EXIT:
            if self.current_state == GameState.MENU:
                menu = MainMenu(self.screen, self.clock)
                self.current_state = menu.run() or GameState.EXIT
            
            elif self.current_state == GameState.HANGAR:
                hangar = HangarDesigner(self.screen, self.clock)
                self.current_state = hangar.run() or GameState.MENU
            
            elif self.current_state == GameState.TRAINING:
                training = TrainingMode(self.screen, self.clock)
                self.current_state = training.run() or GameState.MENU
            
            elif self.current_state == GameState.FORMATION_EDITOR:
                editor = FormationEditor(self.screen, self.clock)
                self.current_state = editor.run() or GameState.MENU
            
            elif self.current_state == GameState.PLAYBACK:
                playback = PlaybackMode(self.screen, self.clock)
                self.current_state = playback.run() or GameState.MENU
        
        pygame.quit()
        sys.exit()


def main():
    game = Game()
    game.run()


if __name__ == "__main__":
    main()
