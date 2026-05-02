#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
野生动物救助中心模拟经营游戏 - 主入口
"""

import pygame
import sys
import os

os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'

from config import SCREEN_WIDTH, SCREEN_HEIGHT, FPS, TITLE, COLORS
from scenes import (
    MainMenuScene, MainGameScene, RescueScene, ExaminationScene,
    TreatmentScene, TrainingScene, ReleaseScene, CageScene,
    PauseScene, XRayPuzzleScene
)


class WildlifeRescueGame:
    """野生动物救助中心游戏主类"""
    
    def __init__(self):
        pygame.init()
        pygame.font.init()
        
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption(TITLE)
        
        self.clock = pygame.time.Clock()
        self.running = True
        
        self._scenes = {}
        self._current_scene = None
        self._scene_name = None
        
        self._setup_icon()
        self._init_scenes()
    
    def _setup_icon(self):
        """设置游戏图标"""
        try:
            icon = pygame.Surface((32, 32), pygame.SRCALPHA)
            pygame.draw.circle(icon, COLORS['grass_green'], (16, 16), 14)
            pygame.draw.circle(icon, COLORS['grass_dark'], (16, 16), 14, 2)
            pygame.draw.circle(icon, COLORS['white'], (12, 14), 3)
            pygame.draw.circle(icon, COLORS['white'], (20, 14), 3)
            pygame.draw.circle(icon, COLORS['black'], (12, 14), 1)
            pygame.draw.circle(icon, COLORS['black'], (20, 14), 1)
            pygame.draw.arc(icon, COLORS['black'], (8, 18, 16, 10), 3.14, 0, 2)
            
            pygame.display.set_icon(icon)
        except Exception as e:
            print(f"Warning: Could not set icon: {e}")
    
    def _init_scenes(self):
        """初始化所有场景"""
        self._scenes = {
            'menu': MainMenuScene(self),
            'game': MainGameScene(self),
            'rescue': RescueScene(self),
            'examination': ExaminationScene(self),
            'treatment': TreatmentScene(self),
            'training': TrainingScene(self),
            'release': ReleaseScene(self),
            'cage': CageScene(self),
            'pause': PauseScene(self),
            'xray_puzzle': XRayPuzzleScene(self),
        }
        
        self.change_scene('menu')
    
    def change_scene(self, scene_name):
        """切换场景"""
        if scene_name in self._scenes:
            self._scene_name = scene_name
            self._current_scene = self._scenes[scene_name]
            self._current_scene.initialize()
    
    def get_current_scene_name(self):
        """获取当前场景名称"""
        return self._scene_name
    
    def handle_events(self):
        """处理事件"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            
            if self._current_scene:
                self._current_scene.handle_event(event)
    
    def update(self, dt):
        """更新游戏"""
        if self._current_scene:
            self._current_scene.update(dt)
    
    def draw(self):
        """绘制游戏"""
        self.screen.fill(COLORS['sky_blue'])
        
        if self._current_scene:
            self._current_scene.draw()
        
        pygame.display.flip()
    
    def run(self):
        """主游戏循环"""
        print(f"Starting {TITLE}...")
        print(f"Screen size: {SCREEN_WIDTH}x{SCREEN_HEIGHT}")
        print(f"FPS target: {FPS}")
        print("\nControls:")
        print("  - Mouse: Click buttons and interact with UI")
        print("  - ESC: Open pause menu / Go back")
        print("  - Close window: Quit game")
        print("\nEnjoy the game!")
        
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0
            
            self.handle_events()
            self.update(dt)
            self.draw()
        
        self.quit()
    
    def quit(self):
        """退出游戏"""
        print("\nThanks for playing!")
        pygame.quit()
        sys.exit()


def main():
    """主函数"""
    game = WildlifeRescueGame()
    game.run()


if __name__ == '__main__':
    main()
