import pygame
import sys
from config import SCREEN_WIDTH, SCREEN_HEIGHT, FPS, TITLE, GameStates
from scenes.main_menu import MainMenu
from scenes.editor import CastleEditor
from scenes.siege_build import SiegeBuild
from scenes.battle import BattleScene
from scenes.pause import PauseScene
from scenes.victory import VictoryScene
from scenes.defeat import DefeatScene
from data.data_manager import DataManager

class CastleSiegeGame:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption(TITLE)
        self.clock = pygame.time.Clock()
        self.running = True
        self.dt = 0
        
        self.data_manager = DataManager()
        
        self.state = GameStates.MENU
        self.previous_state = None
        
        self.scenes = {
            GameStates.MENU: MainMenu(self),
            GameStates.EDITOR: CastleEditor(self),
            GameStates.SIEGE_BUILD: SiegeBuild(self),
            GameStates.BATTLE: BattleScene(self),
            GameStates.PAUSED: PauseScene(self),
            GameStates.VICTORY: VictoryScene(self),
            GameStates.DEFEAT: DefeatScene(self)
        }
        
        self.current_scene = self.scenes[self.state]
        self.current_scene.on_enter()
    
    def change_state(self, new_state):
        self.previous_state = self.state
        self.current_scene.on_exit()
        self.state = new_state
        self.current_scene = self.scenes[self.state]
        self.current_scene.on_enter()
    
    def go_to_previous(self):
        if self.previous_state:
            self.change_state(self.previous_state)
    
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.state == GameStates.BATTLE:
                        self.change_state(GameStates.PAUSED)
                    elif self.state == GameStates.PAUSED:
                        self.change_state(GameStates.BATTLE)
            self.current_scene.handle_event(event)
    
    def update(self):
        self.dt = self.clock.tick(FPS) / 1000.0
        self.current_scene.update(self.dt)
    
    def render(self):
        self.current_scene.render(self.screen)
        pygame.display.flip()
    
    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.render()
        
        pygame.quit()
        sys.exit()

def main():
    game = CastleSiegeGame()
    game.run()

if __name__ == "__main__":
    main()
