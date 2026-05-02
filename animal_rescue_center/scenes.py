#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
野生动物救助中心模拟经营游戏 - 场景系统
"""

import pygame
import random
from abc import ABC, abstractmethod
from config import (
    SCREEN_WIDTH, SCREEN_HEIGHT, COLORS, ANIMAL_TYPES, INJURY_TYPES,
    TREATMENTS, TRAINING_PROGRAMS, GAME_BALANCE
)
from ui_components import (
    Button, Label, ProgressBar, Panel, AnimalCard, MessageBox,
    ScrollPanel, TextInput, Slider, ImageButton
)
from localization import LocalizationManager
from game_state import GameState


class Scene(ABC):
    """场景基类"""
    
    def __init__(self, game):
        self.game = game
        self.screen = game.screen
        self.game_state = GameState()
        self.localization = LocalizationManager()
        self._components = []
        self._initialized = False
    
    @abstractmethod
    def initialize(self):
        """初始化场景"""
        pass
    
    @abstractmethod
    def handle_event(self, event):
        """处理事件"""
        pass
    
    @abstractmethod
    def update(self, dt):
        """更新场景"""
        pass
    
    @abstractmethod
    def draw(self):
        """绘制场景"""
        pass
    
    def add_component(self, component):
        """添加UI组件"""
        self._components.append(component)
    
    def remove_component(self, component):
        """移除UI组件"""
        if component in self._components:
            self._components.remove(component)
    
    def _handle_component_events(self, event):
        """处理组件事件"""
        for component in reversed(self._components):
            if component.handle_event(event):
                return True
        return False
    
    def _draw_components(self):
        """绘制所有组件"""
        for component in self._components:
            component.draw(self.screen)


class MainMenuScene(Scene):
    """主菜单场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.title_font = None
        self.button_font = None
        self.small_font = None
        self.background = None
        self._language_buttons = []
    
    def initialize(self):
        """初始化主菜单"""
        if self._initialized:
            return
        
        self.title_font = pygame.font.Font(None, 72)
        self.button_font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self.background = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        self._draw_background()
        
        button_width = 250
        button_height = 50
        button_x = (SCREEN_WIDTH - button_width) // 2
        button_y = 300
        button_spacing = 70
        
        start_btn = Button(
            button_x, button_y, button_width, button_height,
            text=self.localization.t('start_game'),
            font=self.button_font,
            callback=self._on_start_game
        )
        self.add_component(start_btn)
        
        button_y += button_spacing
        load_btn = Button(
            button_x, button_y, button_width, button_height,
            text=self.localization.t('load_game'),
            font=self.button_font,
            callback=self._on_load_game
        )
        self.add_component(load_btn)
        
        if not self.game_state.has_save_game():
            load_btn.enabled = False
        
        button_y += button_spacing
        settings_btn = Button(
            button_x, button_y, button_width, button_height,
            text=self.localization.t('settings'),
            font=self.button_font,
            callback=self._on_settings
        )
        self.add_component(settings_btn)
        
        button_y += button_spacing
        quit_btn = Button(
            button_x, button_y, button_width, button_height,
            text=self.localization.t('quit'),
            font=self.button_font,
            callback=self._on_quit
        )
        self.add_component(quit_btn)
        
        self._create_language_buttons()
        
        self._initialized = True
    
    def _draw_background(self):
        """绘制自然绿地风格背景"""
        self.background.fill(COLORS['sky_blue'])
        
        pygame.draw.ellipse(self.background, COLORS['white'], (50, 80, 200, 80))
        pygame.draw.ellipse(self.background, COLORS['white'], (300, 50, 180, 70))
        pygame.draw.ellipse(self.background, COLORS['white'], (800, 100, 220, 90))
        pygame.draw.ellipse(self.background, COLORS['white'], (1000, 60, 160, 60))
        
        pygame.draw.rect(self.background, COLORS['grass_green'], (0, SCREEN_HEIGHT - 200, SCREEN_WIDTH, 200))
        
        for i in range(5):
            x = 100 + i * 250
            y = SCREEN_HEIGHT - 200
            pygame.draw.rect(self.background, COLORS['wood_brown'], (x - 10, y - 80, 20, 100))
            pygame.draw.circle(self.background, COLORS['grass_dark'], (x, y - 100), 50)
            pygame.draw.circle(self.background, COLORS['leaf_green'], (x - 20, y - 90), 35)
            pygame.draw.circle(self.background, COLORS['leaf_green'], (x + 25, y - 85), 30)
        
        for _ in range(20):
            x = random.randint(0, SCREEN_WIDTH)
            y = random.randint(SCREEN_HEIGHT - 200, SCREEN_HEIGHT)
            flower_colors = [COLORS['red'], COLORS['yellow'], COLORS['purple']]
            pygame.draw.circle(self.background, random.choice(flower_colors), (x, y), 5)
    
    def _create_language_buttons(self):
        """创建语言选择按钮"""
        button_size = 40
        start_x = SCREEN_WIDTH - 150
        button_y = 20
        button_spacing = 10
        
        languages = self.localization.get_available_languages()
        current_lang = self.localization.get_language()
        
        for i, (code, name) in enumerate(languages):
            button_x = start_x + i * (button_size + button_spacing)
            
            def make_callback(lang_code=code):
                return lambda: self._on_language_change(lang_code)
            
            btn = Button(
                button_x, button_y, button_size, button_size,
                text=code.upper(),
                font=self.small_font,
                callback=make_callback
            )
            
            if code == current_lang:
                btn.border_radius = 0
            
            self._language_buttons.append((code, btn))
            self.add_component(btn)
    
    def _on_language_change(self, lang_code):
        """语言改变处理"""
        self.game_state.set_language(lang_code)
        self._initialized = False
        self._components = []
        self.initialize()
    
    def _on_start_game(self):
        """开始游戏"""
        self.game_state.new_game()
        self.game.change_scene('game')
    
    def _on_load_game(self):
        """读取存档"""
        success, message = self.game_state.load_game()
        if success:
            self.game.change_scene('game')
        else:
            print(message)
    
    def _on_settings(self):
        """设置按钮"""
        pass
    
    def _on_quit(self):
        """退出游戏"""
        self.game.running = False
    
    def handle_event(self, event):
        """处理事件"""
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新场景"""
        pass
    
    def draw(self):
        """绘制场景"""
        self.screen.blit(self.background, (0, 0))
        
        title_text = self.localization.t('game_title')
        title_surface = self.title_font.render(title_text, True, COLORS['grass_dark'])
        title_rect = title_surface.get_rect(center=(SCREEN_WIDTH // 2, 180))
        self.screen.blit(title_surface, title_rect)
        
        subtitle = self.localization.t('rescue_center')
        subtitle_surface = self.button_font.render(subtitle, True, COLORS['wood_brown'])
        subtitle_rect = subtitle_surface.get_rect(center=(SCREEN_WIDTH // 2, 240))
        self.screen.blit(subtitle_surface, subtitle_rect)
        
        self._draw_components()


class MainGameScene(Scene):
    """主游戏场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self.small_font = None
        self.large_font = None
        self.background = None
        self.top_bar = None
        self.nav_buttons = {}
        self.animal_scroll = None
        self.animal_cards = []
        self.message_box = None
        self.current_module = 'overview'
    
    def initialize(self):
        """初始化主游戏场景"""
        if self._initialized:
            return
        
        self.font = pygame.font.Font(None, 32)
        self.small_font = pygame.font.Font(None, 24)
        self.large_font = pygame.font.Font(None, 48)
        
        self.background = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        self._draw_background()
        
        self._create_top_bar()
        self._create_navigation()
        self._create_animal_list()
        self._create_message_box()
        
        self._initialized = True
    
    def _draw_background(self):
        """绘制背景"""
        self.background.fill(COLORS['grass_light'])
        
        for _ in range(50):
            x = random.randint(0, SCREEN_WIDTH)
            y = random.randint(80, SCREEN_HEIGHT)
            pygame.draw.circle(self.background, COLORS['leaf_green'], (x, y), random.randint(2, 5))
    
    def _create_top_bar(self):
        """创建顶部信息栏"""
        self.top_bar = Panel(0, 0, SCREEN_WIDTH, 70, COLORS['wood_brown'], COLORS['dark_gray'], 0, 0)
        self.add_component(self.top_bar)
        
        day_label = Label(
            30, 20, 150, 30,
            text='',
            font=self.font,
            text_color=COLORS['white'],
            bg_color=None
        )
        self.top_bar.add_component(day_label)
        self.day_label = day_label
        
        money_label = Label(
            250, 20, 200, 30,
            text='',
            font=self.font,
            text_color=COLORS['yellow'],
            bg_color=None
        )
        self.top_bar.add_component(money_label)
        self.money_label = money_label
        
        reputation_label = Label(
            500, 20, 200, 30,
            text='',
            font=self.font,
            text_color=COLORS['grass_light'],
            bg_color=None
        )
        self.top_bar.add_component(reputation_label)
        self.reputation_label = reputation_label
        
        animals_label = Label(
            750, 20, 200, 30,
            text='',
            font=self.font,
            text_color=COLORS['white'],
            bg_color=None
        )
        self.top_bar.add_component(animals_label)
        self.animals_label = animals_label
        
        pause_btn = Button(
            SCREEN_WIDTH - 120, 15, 100, 40,
            text='⏸',
            font=self.font,
            callback=self._on_pause
        )
        self.top_bar.add_component(pause_btn)
    
    def _create_navigation(self):
        """创建导航按钮"""
        nav_y = 80
        nav_height = 50
        nav_width = SCREEN_WIDTH // 6
        
        nav_items = [
            ('rescue', self.localization.t('rescue'), self._on_nav_rescue),
            ('examination', self.localization.t('examination'), self._on_nav_examination),
            ('cage', self.localization.t('cage'), self._on_nav_cage),
            ('treatment', self.localization.t('treatment'), self._on_nav_treatment),
            ('training', self.localization.t('training'), self._on_nav_training),
            ('release', self.localization.t('release'), self._on_nav_release),
        ]
        
        for i, (key, text, callback) in enumerate(nav_items):
            btn_x = i * nav_width
            btn = Button(
                btn_x, nav_y, nav_width, nav_height,
                text=text,
                font=self.small_font,
                callback=callback
            )
            self.nav_buttons[key] = btn
            self.add_component(btn)
    
    def _create_animal_list(self):
        """创建动物列表"""
        self.animal_scroll = ScrollPanel(
            20, 150, 350, SCREEN_HEIGHT - 170,
            bg_color=COLORS['cream'],
            border_color=COLORS['wood_brown']
        )
        self.add_component(self.animal_scroll)
        
        self._update_animal_cards()
    
    def _create_message_box(self):
        """创建消息对话框"""
        self.message_box = MessageBox(
            SCREEN_WIDTH // 2 - 200, SCREEN_HEIGHT // 2 - 150,
            400, 300,
            message='',
            title='',
            font=self.font,
            buttons=[(self.localization.t('yes'), True), (self.localization.t('no'), False)]
        )
        self.message_box.visible = False
        self.add_component(self.message_box)
    
    def _update_animal_cards(self):
        """更新动物卡片列表"""
        for card in self.animal_cards:
            self.animal_scroll.remove_component(card)
        self.animal_cards = []
        
        animals = self.game_state.get_all_animals()
        
        card_y = 10
        for animal in animals:
            card = AnimalCard(
                10, card_y, 320, 120,
                animal_data=animal,
                font=self.small_font,
                callback=self._on_animal_select
            )
            card.small_font = pygame.font.Font(None, 18)
            
            if self.game_state.selected_animal_id == animal['id']:
                card.set_selected(True)
            
            self.animal_cards.append(card)
            self.animal_scroll.add_component(card)
            card_y += 130
        
        self.animal_scroll.set_content_height(card_y + 10)
    
    def _update_top_bar(self):
        """更新顶部信息栏"""
        day_text = f'{self.localization.t("day")} {self.game_state.day} {self.localization.t("day_suffix")}'
        self.day_label.set_text(day_text)
        
        money_text = f'💰 ¥{self.game_state.money:,}'
        self.money_label.set_text(money_text)
        
        rep_text = f'⭐ {self.localization.t("reputation")}: {self.game_state.reputation}'
        self.reputation_label.set_text(rep_text)
        
        animals = self.game_state.get_all_animals()
        animal_text = f'🐾 {len(animals)}/{self.game_state.animal_capacity}'
        self.animals_label.set_text(animal_text)
    
    def _on_animal_select(self, animal_data):
        """选择动物"""
        animal_id = animal_data['id']
        
        for card in self.animal_cards:
            if card.animal_data and card.animal_data['id'] == animal_id:
                card.set_selected(True)
            else:
                card.set_selected(False)
        
        self.game_state.select_animal(animal_id)
    
    def _on_pause(self):
        """暂停按钮"""
        self.game.change_scene('pause')
    
    def _on_nav_rescue(self):
        """收容导航"""
        self.game.change_scene('rescue')
    
    def _on_nav_examination(self):
        """体检导航"""
        if self.game_state.selected_animal_id:
            self.game.change_scene('examination')
    
    def _on_nav_cage(self):
        """笼舍导航"""
        self.game.change_scene('cage')
    
    def _on_nav_treatment(self):
        """治疗导航"""
        if self.game_state.selected_animal_id:
            self.game.change_scene('treatment')
    
    def _on_nav_training(self):
        """训练导航"""
        if self.game_state.selected_animal_id:
            self.game.change_scene('training')
    
    def _on_nav_release(self):
        """野放导航"""
        self.game.change_scene('release')
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self.game.change_scene('pause')
                return True
        
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新场景"""
        self.game_state.update(dt)
        self._update_top_bar()
        self._update_animal_cards()
        self._update_messages()
    
    def _update_messages(self):
        """更新消息显示"""
        pass
    
    def draw(self):
        """绘制场景"""
        self.screen.blit(self.background, (0, 0))
        
        self._draw_components()
        
        self._draw_selected_animal_info()
        self._draw_activity_log()
    
    def _draw_selected_animal_info(self):
        """绘制选中动物信息"""
        animal = self.game_state.get_selected_animal()
        if not animal:
            return
        
        info_x = 400
        info_y = 150
        info_width = SCREEN_WIDTH - 420
        info_height = 300
        
        info_panel = pygame.Surface((info_width, info_height), pygame.SRCALPHA)
        pygame.draw.rect(info_panel, (*COLORS['cream'], 230), (0, 0, info_width, info_height), border_radius=15)
        pygame.draw.rect(info_panel, (*COLORS['wood_brown'], 255), (0, 0, info_width, info_height), width=3, border_radius=15)
        
        animal_type = animal.get('animal_type', 'unknown')
        animal_name = self.localization.translate_animal_type(animal_type)
        
        title_surface = self.large_font.render(animal_name, True, COLORS['grass_dark'])
        info_panel.blit(title_surface, (20, 20))
        
        rarity = animal.get('rarity', 'common')
        rarity_text = self.localization.translate_rarity(rarity)
        rarity_surface = self.font.render(rarity_text, True, COLORS['dark_gray'])
        info_panel.blit(rarity_surface, (20, 70))
        
        status_y = 120
        bar_width = info_width - 60
        bar_height = 25
        bar_spacing = 45
        
        health = animal.get('health', 50)
        hunger = animal.get('hunger', 50)
        happiness = animal.get('happiness', 50)
        energy = animal.get('energy', 100)
        release_rate = animal.get('release_success_rate', 0.5) * 100
        
        self._draw_stat_bar(info_panel, 20, status_y, bar_width, bar_height,
                           health, COLORS['green'], COLORS['red'],
                           self.localization.t('health'))
        status_y += bar_spacing
        
        self._draw_stat_bar(info_panel, 20, status_y, bar_width, bar_height,
                           hunger, COLORS['orange'], COLORS['gray'],
                           self.localization.t('hunger'))
        status_y += bar_spacing
        
        self._draw_stat_bar(info_panel, 20, status_y, bar_width, bar_height,
                           happiness, COLORS['purple'], COLORS['gray'],
                           self.localization.t('happiness'))
        status_y += bar_spacing
        
        self._draw_stat_bar(info_panel, 20, status_y, bar_width, bar_height,
                           energy, COLORS['yellow'], COLORS['gray'],
                           'Energy')
        status_y += bar_spacing
        
        self._draw_stat_bar(info_panel, 20, status_y, bar_width, bar_height,
                           release_rate, COLORS['grass_green'], COLORS['gray'],
                           self.localization.t('success_rate'))
        
        self.screen.blit(info_panel, (info_x, info_y))
    
    def _draw_stat_bar(self, surface, x, y, width, height, value, color, bg_color, label):
        """绘制状态条"""
        pygame.draw.rect(surface, bg_color, (x, y, width, height), border_radius=5)
        
        fill_width = int(width * value / 100)
        if fill_width > 0:
            pygame.draw.rect(surface, color, (x, y, fill_width, height), border_radius=5)
        
        pygame.draw.rect(surface, COLORS['dark_gray'], (x, y, width, height), width=2, border_radius=5)
        
        label_surface = self.small_font.render(f'{label}: {int(value)}%', True, COLORS['black'])
        surface.blit(label_surface, (x + 5, y - 20))
    
    def _draw_activity_log(self):
        """绘制活动日志"""
        log_x = 400
        log_y = 470
        log_width = SCREEN_WIDTH - 420
        log_height = SCREEN_HEIGHT - 490
        
        log_panel = pygame.Surface((log_width, log_height), pygame.SRCALPHA)
        pygame.draw.rect(log_panel, (*COLORS['cream'], 230), (0, 0, log_width, log_height), border_radius=15)
        pygame.draw.rect(log_panel, (*COLORS['wood_brown'], 255), (0, 0, log_width, log_height), width=3, border_radius=15)
        
        title_surface = self.font.render(self.localization.t('activity'), True, COLORS['grass_dark'])
        log_panel.blit(title_surface, (20, 15))
        
        y_offset = 50
        for msg in self.game_state.messages[-5:]:
            msg_text = msg.get('text', '')
            msg_surface = self.small_font.render(msg_text, True, COLORS['dark_gray'])
            log_panel.blit(msg_surface, (20, y_offset))
            y_offset += 25
        
        self.screen.blit(log_panel, (log_x, log_y))


class RescueScene(Scene):
    """收容场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self.small_font = None
        self.background = None
        self.animal_preview = None
        self.accept_btn = None
        self.reject_btn = None
        self.back_btn = None
    
    def initialize(self):
        """初始化收容场景"""
        if self._initialized:
            return
        
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self.background = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.background.fill(COLORS['grass_light'])
        
        self._create_ui()
        self._initialized = True
    
    def _create_ui(self):
        """创建UI"""
        self.back_btn = Button(
            20, 20, 100, 40,
            text='← ' + self.localization.t('menu'),
            font=self.small_font,
            callback=self._on_back
        )
        self.add_component(self.back_btn)
        
        title = Label(
            SCREEN_WIDTH // 2 - 150, 30, 300, 50,
            text=self.localization.t('rescue'),
            font=self.font,
            text_color=COLORS['grass_dark'],
            bg_color=None,
            alignment='center'
        )
        self.add_component(title)
        
        animals = self.game_state.get_all_animals()
        
        self.accept_btn = Button(
            SCREEN_WIDTH // 2 - 150, SCREEN_HEIGHT - 100, 120, 50,
            text=self.localization.t('accept'),
            font=self.font,
            callback=self._on_accept
        )
        self.add_component(self.accept_btn)
        
        self.reject_btn = Button(
            SCREEN_WIDTH // 2 + 30, SCREEN_HEIGHT - 100, 120, 50,
            text=self.localization.t('reject'),
            font=self.font,
            callback=self._on_reject
        )
        self.add_component(self.reject_btn)
    
    def _on_back(self):
        """返回"""
        self.game.change_scene('game')
    
    def _on_accept(self):
        """接收动物"""
        pass
    
    def _on_reject(self):
        """拒绝动物"""
        pass
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._on_back()
                return True
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新"""
        pass
    
    def draw(self):
        """绘制"""
        self.screen.blit(self.background, (0, 0))
        self._draw_components()
        self._draw_animal_info()
    
    def _draw_animal_info(self):
        """绘制动物信息"""
        animals = self.game_state.get_all_animals()
        
        info_x = SCREEN_WIDTH // 2 - 300
        info_y = 120
        info_width = 600
        info_height = SCREEN_HEIGHT - 250
        
        info_panel = pygame.Surface((info_width, info_height))
        pygame.draw.rect(info_panel, COLORS['cream'], (0, 0, info_width, info_height), border_radius=15)
        pygame.draw.rect(info_panel, COLORS['wood_brown'], (0, 0, info_width, info_height), width=3, border_radius=15)
        
        title = self.font.render(self.localization.t('animals'), True, COLORS['grass_dark'])
        title_rect = title.get_rect(center=(info_width // 2, 30))
        info_panel.blit(title, title_rect)
        
        y_offset = 80
        for animal in animals[:5]:
            animal_type = animal.get('animal_type', 'unknown')
            animal_name = self.localization.translate_animal_type(animal_type)
            health = animal.get('health', 50)
            
            text = f'{animal_name} - {self.localization.t("health")}: {health}%'
            text_surface = self.small_font.render(text, True, COLORS['dark_gray'])
            info_panel.blit(text_surface, (30, y_offset))
            y_offset += 35
        
        if not animals:
            no_animal_text = self.small_font.render(self.localization.t('new_animal_arrived'), True, COLORS['dark_gray'])
            no_animal_rect = no_animal_text.get_rect(center=(info_width // 2, info_height // 2))
            info_panel.blit(no_animal_text, no_animal_rect)
        
        self.screen.blit(info_panel, (info_x, info_y))


class ExaminationScene(Scene):
    """体检场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self.small_font = None
        self.palpation_btn = None
        self.xray_btn = None
        self.blood_test_btn = None
        self.back_btn = None
        self.examination_results = []
    
    def initialize(self):
        """初始化体检场景"""
        if self._initialized:
            return
        
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self._create_ui()
        self._initialized = True
    
    def _create_ui(self):
        """创建UI"""
        self.back_btn = Button(
            20, 20, 100, 40,
            text='← ' + self.localization.t('menu'),
            font=self.small_font,
            callback=self._on_back
        )
        self.add_component(self.back_btn)
        
        title = Label(
            SCREEN_WIDTH // 2 - 200, 30, 400, 50,
            text=self.localization.t('physical_examination'),
            font=self.font,
            text_color=COLORS['grass_dark'],
            bg_color=None,
            alignment='center'
        )
        self.add_component(title)
        
        btn_width = 180
        btn_height = 60
        btn_y = 150
        btn_spacing = 220
        
        self.palpation_btn = Button(
            SCREEN_WIDTH // 2 - btn_width * 1.5 - btn_spacing, btn_y,
            btn_width, btn_height,
            text=self.localization.t('palpation'),
            font=self.font,
            callback=self._on_palpation
        )
        self.add_component(self.palpation_btn)
        
        self.xray_btn = Button(
            SCREEN_WIDTH // 2 - btn_width // 2, btn_y,
            btn_width, btn_height,
            text=self.localization.t('xray'),
            font=self.font,
            callback=self._on_xray
        )
        self.add_component(self.xray_btn)
        
        self.blood_test_btn = Button(
            SCREEN_WIDTH // 2 + btn_width // 2 + btn_spacing, btn_y,
            btn_width, btn_height,
            text=self.localization.t('blood_test'),
            font=self.font,
            callback=self._on_blood_test
        )
        self.add_component(self.blood_test_btn)
    
    def _on_back(self):
        """返回"""
        self.game.change_scene('game')
    
    def _on_palpation(self):
        """触诊"""
        animal = self.game_state.get_selected_animal()
        if animal:
            injuries = self.game_state.db.get_animal_injuries(animal['id'])
            symptoms = []
            for injury in injuries:
                injury_config = INJURY_TYPES.get(injury['injury_type'], {})
                injury_symptoms = injury_config.get('symptoms', [])
                symptoms.extend(injury_symptoms)
            
            result = f'{self.localization.t("palpation")}: {", ".join(symptoms[:3]) if symptoms else "无明显异常"}'
            self.examination_results.append(result)
    
    def _on_xray(self):
        """X光检查"""
        self.game.change_scene('xray_puzzle')
    
    def _on_blood_test(self):
        """采血化验"""
        animal = self.game_state.get_selected_animal()
        if animal:
            wbc = random.uniform(4, 12)
            rbc = random.uniform(4, 6)
            platelets = random.uniform(150, 450)
            glucose = random.uniform(70, 140)
            
            self.game_state.db.add_blood_test(animal['id'], wbc, rbc, platelets, glucose)
            
            result = f'{self.localization.t("blood_test_result")}: WBC={wbc:.1f}, RBC={rbc:.1f}'
            self.examination_results.append(result)
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._on_back()
                return True
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新"""
        pass
    
    def draw(self):
        """绘制"""
        self.screen.fill(COLORS['grass_light'])
        self._draw_components()
        self._draw_animal_info()
        self._draw_results()
    
    def _draw_animal_info(self):
        """绘制动物信息"""
        animal = self.game_state.get_selected_animal()
        if not animal:
            return
        
        info_x = 50
        info_y = 250
        info_width = 300
        info_height = 200
        
        pygame.draw.rect(self.screen, COLORS['cream'], (info_x, info_y, info_width, info_height), border_radius=10)
        pygame.draw.rect(self.screen, COLORS['wood_brown'], (info_x, info_y, info_width, info_height), width=2, border_radius=10)
        
        animal_type = animal.get('animal_type', 'unknown')
        animal_name = self.localization.translate_animal_type(animal_type)
        
        name_surface = self.font.render(animal_name, True, COLORS['grass_dark'])
        self.screen.blit(name_surface, (info_x + 20, info_y + 20))
        
        health = animal.get('health', 50)
        health_surface = self.small_font.render(f'{self.localization.t("health")}: {health}%', True, COLORS['dark_gray'])
        self.screen.blit(health_surface, (info_x + 20, info_y + 60))
        
        injuries = self.game_state.db.get_animal_injuries(animal['id'])
        injury_y = info_y + 90
        for injury in injuries:
            injury_type = injury.get('injury_type', 'unknown')
            injury_config = INJURY_TYPES.get(injury_type, {})
            injury_name = injury_config.get('name', injury_type)
            
            injury_surface = self.small_font.render(f'• {injury_name}', True, COLORS['red'])
            self.screen.blit(injury_surface, (info_x + 20, injury_y))
            injury_y += 25
    
    def _draw_results(self):
        """绘制检查结果"""
        result_x = SCREEN_WIDTH - 350
        result_y = 250
        result_width = 300
        result_height = 400
        
        pygame.draw.rect(self.screen, COLORS['cream'], (result_x, result_y, result_width, result_height), border_radius=10)
        pygame.draw.rect(self.screen, COLORS['wood_brown'], (result_x, result_y, result_width, result_height), width=2, border_radius=10)
        
        title_surface = self.font.render(self.localization.t('diagnosis'), True, COLORS['grass_dark'])
        self.screen.blit(title_surface, (result_x + 20, result_y + 20))
        
        y_offset = result_y + 60
        for result in self.examination_results[-10:]:
            result_surface = self.small_font.render(result, True, COLORS['dark_gray'])
            self.screen.blit(result_surface, (result_x + 20, y_offset))
            y_offset += 30


class XRayPuzzleScene(Scene):
    """X光拼图场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self.small_font = None
        self.back_btn = None
        self.puzzle_grid = []
        self.grid_size = 3
        self.piece_size = 120
        self.selected_piece = None
        self.time_limit = 60
        self.time_left = 60
        self.completed = False
        self.failed = False
        self.puzzle_complete = False
    
    def initialize(self):
        """初始化X光拼图场景"""
        if self._initialized:
            return
        
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self.time_left = self.time_limit
        self.completed = False
        self.failed = False
        self.puzzle_complete = False
        self.selected_piece = None
        
        self._create_puzzle()
        self._create_ui()
        self._initialized = True
    
    def _create_puzzle(self):
        """创建拼图"""
        self.puzzle_grid = []
        total_pieces = self.grid_size * self.grid_size
        
        pieces = list(range(total_pieces))
        random.shuffle(pieces)
        
        for i in range(self.grid_size):
            row = []
            for j in range(self.grid_size):
                row.append(pieces[i * self.grid_size + j])
            self.puzzle_grid.append(row)
    
    def _create_ui(self):
        """创建UI"""
        self.back_btn = Button(
            20, 20, 100, 40,
            text='← ' + self.localization.t('menu'),
            font=self.small_font,
            callback=self._on_back
        )
        self.add_component(self.back_btn)
        
        title = Label(
            SCREEN_WIDTH // 2 - 150, 30, 300, 50,
            text=self.localization.t('xray_puzzle'),
            font=self.font,
            text_color=COLORS['grass_dark'],
            bg_color=None,
            alignment='center'
        )
        self.add_component(title)
    
    def _on_back(self):
        """返回"""
        self.game.change_scene('examination')
    
    def _check_complete(self):
        """检查拼图是否完成"""
        expected = 0
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                if self.puzzle_grid[i][j] != expected:
                    return False
                expected += 1
        return True
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._on_back()
                return True
        
        if self.puzzle_complete or self.failed:
            return self._handle_component_events(event)
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            grid_start_x = (SCREEN_WIDTH - self.grid_size * self.piece_size) // 2
            grid_start_y = 120
            
            mouse_x, mouse_y = event.pos
            
            col = (mouse_x - grid_start_x) // self.piece_size
            row = (mouse_y - grid_start_y) // self.piece_size
            
            if 0 <= row < self.grid_size and 0 <= col < self.grid_size:
                if self.selected_piece is None:
                    self.selected_piece = (row, col)
                else:
                    s_row, s_col = self.selected_piece
                    if (s_row, s_col) != (row, col):
                        self.puzzle_grid[s_row][s_col], self.puzzle_grid[row][col] = \
                            self.puzzle_grid[row][col], self.puzzle_grid[s_row][s_col]
                        
                        if self._check_complete():
                            self.puzzle_complete = True
                            animal = self.game_state.get_selected_animal()
                            if animal:
                                injuries = self.game_state.db.get_animal_injuries(animal['id'])
                                for injury in injuries:
                                    self.game_state.db.update_injury(injury['id'], diagnosed=1)
                            
                            self.game_state.add_message(self.localization.t('puzzle_complete'), 'success')
                    
                    self.selected_piece = None
        
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新"""
        if not self.puzzle_complete and not self.failed:
            self.time_left -= dt
            if self.time_left <= 0:
                self.failed = True
                self.time_left = 0
                self.game_state.add_message(self.localization.t('puzzle_failed'), 'warning')
    
    def draw(self):
        """绘制"""
        self.screen.fill(COLORS['grass_light'])
        
        self._draw_components()
        
        time_surface = self.font.render(
            f'{self.localization.t("time_limit")}: {int(self.time_left)}s',
            True,
            COLORS['red'] if self.time_left < 10 else COLORS['black']
        )
        self.screen.blit(time_surface, (SCREEN_WIDTH // 2 - 100, 80))
        
        if self.puzzle_complete:
            complete_surface = self.font.render(self.localization.t('puzzle_complete'), True, COLORS['green'])
            self.screen.blit(complete_surface, (SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT - 80))
        elif self.failed:
            fail_surface = self.font.render(self.localization.t('puzzle_failed'), True, COLORS['red'])
            self.screen.blit(fail_surface, (SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT - 80))
        else:
            self._draw_puzzle_grid()
    
    def _draw_puzzle_grid(self):
        """绘制拼图网格"""
        grid_start_x = (SCREEN_WIDTH - self.grid_size * self.piece_size) // 2
        grid_start_y = 120
        
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                piece_x = grid_start_x + j * self.piece_size
                piece_y = grid_start_y + i * self.piece_size
                
                piece_value = self.puzzle_grid[i][j]
                
                piece_rect = pygame.Rect(piece_x, piece_y, self.piece_size - 2, self.piece_size - 2)
                
                gray_value = 100 + piece_value * 15
                piece_color = (gray_value, gray_value, gray_value)
                
                if self.selected_piece and self.selected_piece == (i, j):
                    border_color = COLORS['yellow']
                    border_width = 4
                else:
                    border_color = COLORS['dark_gray']
                    border_width = 2
                
                pygame.draw.rect(self.screen, piece_color, piece_rect)
                pygame.draw.rect(self.screen, border_color, piece_rect, border_width)
                
                number_surface = self.font.render(str(piece_value + 1), True, COLORS['white'])
                number_rect = number_surface.get_rect(center=piece_rect.center)
                self.screen.blit(number_surface, number_rect)


class TreatmentScene(Scene):
    """治疗场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self.small_font = None
        self.back_btn = None
        self.treatment_buttons = {}
    
    def initialize(self):
        """初始化治疗场景"""
        if self._initialized:
            return
        
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self._create_ui()
        self._initialized = True
    
    def _create_ui(self):
        """创建UI"""
        self.back_btn = Button(
            20, 20, 100, 40,
            text='← ' + self.localization.t('menu'),
            font=self.small_font,
            callback=self._on_back
        )
        self.add_component(self.back_btn)
        
        title = Label(
            SCREEN_WIDTH // 2 - 150, 30, 300, 50,
            text=self.localization.t('treatment'),
            font=self.font,
            text_color=COLORS['grass_dark'],
            bg_color=None,
            alignment='center'
        )
        self.add_component(title)
        
        btn_width = 200
        btn_height = 60
        start_x = 50
        btn_y = 150
        btn_spacing = 30
        
        treatments_list = list(TREATMENTS.items())
        
        for i, (key, config) in enumerate(treatments_list):
            col = i % 3
            row = i // 3
            
            btn_x = start_x + col * (btn_width + btn_spacing)
            btn_pos_y = btn_y + row * (btn_height + 40)
            
            def make_callback(treatment_key=key):
                return lambda: self._on_treatment(treatment_key)
            
            btn = Button(
                btn_x, btn_pos_y, btn_width, btn_height,
                text=self.localization.t(key),
                font=self.small_font,
                callback=make_callback
            )
            self.treatment_buttons[key] = btn
            self.add_component(btn)
    
    def _on_back(self):
        """返回"""
        self.game.change_scene('game')
    
    def _on_treatment(self, treatment_type):
        """选择治疗"""
        animal = self.game_state.get_selected_animal()
        if animal:
            success, message = self.game_state.start_treatment(animal['id'], treatment_type)
            if success:
                self.game_state.add_message(message, 'success')
            else:
                self.game_state.add_message(message, 'warning')
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._on_back()
                return True
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新"""
        pass
    
    def draw(self):
        """绘制"""
        self.screen.fill(COLORS['grass_light'])
        
        self._draw_components()
        self._draw_animal_info()
        self._draw_treatment_info()
    
    def _draw_animal_info(self):
        """绘制动物信息"""
        animal = self.game_state.get_selected_animal()
        if not animal:
            return
        
        info_x = 50
        info_y = SCREEN_HEIGHT - 200
        info_width = SCREEN_WIDTH - 100
        info_height = 150
        
        pygame.draw.rect(self.screen, COLORS['cream'], (info_x, info_y, info_width, info_height), border_radius=10)
        pygame.draw.rect(self.screen, COLORS['wood_brown'], (info_x, info_y, info_width, info_height), width=2, border_radius=10)
        
        animal_type = animal.get('animal_type', 'unknown')
        animal_name = self.localization.translate_animal_type(animal_type)
        
        name_surface = self.font.render(animal_name, True, COLORS['grass_dark'])
        self.screen.blit(name_surface, (info_x + 20, info_y + 20))
        
        injuries = self.game_state.db.get_animal_injuries(animal['id'])
        injury_y = info_y + 60
        for injury in injuries:
            if injury['treated']:
                continue
            injury_type = injury.get('injury_type', 'unknown')
            injury_config = INJURY_TYPES.get(injury_type, {})
            injury_name = injury_config.get('name', injury_type)
            
            injury_surface = self.small_font.render(f'• {injury_name}', True, COLORS['red'])
            self.screen.blit(injury_surface, (info_x + 20, injury_y))
            injury_y += 25
    
    def _draw_treatment_info(self):
        """绘制治疗信息"""
        animal = self.game_state.get_selected_animal()
        if not animal:
            return
        
        active_treatments = self.game_state.db.get_active_treatments(animal['id'])
        
        if active_treatments:
            info_x = SCREEN_WIDTH - 350
            info_y = 150
            info_width = 300
            info_height = 200
            
            pygame.draw.rect(self.screen, COLORS['cream'], (info_x, info_y, info_width, info_height), border_radius=10)
            pygame.draw.rect(self.screen, COLORS['wood_brown'], (info_x, info_y, info_width, info_height), width=2, border_radius=10)
            
            title_surface = self.font.render(self.localization.t('treatment_in_progress'), True, COLORS['grass_dark'])
            self.screen.blit(title_surface, (info_x + 20, info_y + 20))
            
            y_offset = info_y + 60
            for treatment in active_treatments:
                treatment_type = treatment.get('treatment_type', 'unknown')
                progress = treatment.get('progress', 0)
                
                type_surface = self.small_font.render(self.localization.t(treatment_type), True, COLORS['dark_gray'])
                self.screen.blit(type_surface, (info_x + 20, y_offset))
                
                bar_width = info_width - 40
                bar_height = 15
                bar_x = info_x + 20
                bar_y = y_offset + 25
                
                pygame.draw.rect(self.screen, COLORS['gray'], (bar_x, bar_y, bar_width, bar_height), border_radius=5)
                
                fill_width = int(bar_width * progress / 100)
                if fill_width > 0:
                    pygame.draw.rect(self.screen, COLORS['grass_green'], (bar_x, bar_y, fill_width, bar_height), border_radius=5)
                
                pygame.draw.rect(self.screen, COLORS['dark_gray'], (bar_x, bar_y, bar_width, bar_height), width=1, border_radius=5)
                
                progress_text = f'{int(progress)}%'
                progress_surface = self.small_font.render(progress_text, True, COLORS['white'])
                self.screen.blit(progress_surface, (bar_x + bar_width // 2 - 20, bar_y + 2))
                
                y_offset += 60


class TrainingScene(Scene):
    """训练场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self.small_font = None
        self.back_btn = None
        self.training_buttons = {}
    
    def initialize(self):
        """初始化训练场景"""
        if self._initialized:
            return
        
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self._create_ui()
        self._initialized = True
    
    def _create_ui(self):
        """创建UI"""
        self.back_btn = Button(
            20, 20, 100, 40,
            text='← ' + self.localization.t('menu'),
            font=self.small_font,
            callback=self._on_back
        )
        self.add_component(self.back_btn)
        
        title = Label(
            SCREEN_WIDTH // 2 - 150, 30, 300, 50,
            text=self.localization.t('behavior_training'),
            font=self.font,
            text_color=COLORS['grass_dark'],
            bg_color=None,
            alignment='center'
        )
        self.add_component(title)
        
        btn_width = 200
        btn_height = 60
        start_x = 50
        btn_y = 150
        btn_spacing = 30
        
        trainings_list = list(TRAINING_PROGRAMS.items())
        
        for i, (key, config) in enumerate(trainings_list):
            col = i % 2
            row = i // 2
            
            btn_x = start_x + col * (btn_width + btn_spacing + 100)
            btn_pos_y = btn_y + row * (btn_height + 60)
            
            def make_callback(training_key=key):
                return lambda: self._on_training(training_key)
            
            btn = Button(
                btn_x, btn_pos_y, btn_width, btn_height,
                text=self.localization.t(key),
                font=self.small_font,
                callback=make_callback
            )
            self.training_buttons[key] = btn
            self.add_component(btn)
    
    def _on_back(self):
        """返回"""
        self.game.change_scene('game')
    
    def _on_training(self, training_type):
        """选择训练"""
        animal = self.game_state.get_selected_animal()
        if animal:
            success, message = self.game_state.start_training(animal['id'], training_type)
            if success:
                self.game_state.add_message(message, 'success')
            else:
                self.game_state.add_message(message, 'warning')
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._on_back()
                return True
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新"""
        pass
    
    def draw(self):
        """绘制"""
        self.screen.fill(COLORS['grass_light'])
        
        self._draw_components()
        self._draw_animal_info()
        self._draw_training_descriptions()
    
    def _draw_animal_info(self):
        """绘制动物信息"""
        animal = self.game_state.get_selected_animal()
        if not animal:
            return
        
        info_x = SCREEN_WIDTH - 350
        info_y = 150
        info_width = 300
        info_height = 250
        
        pygame.draw.rect(self.screen, COLORS['cream'], (info_x, info_y, info_width, info_height), border_radius=10)
        pygame.draw.rect(self.screen, COLORS['wood_brown'], (info_x, info_y, info_width, info_height), width=2, border_radius=10)
        
        animal_type = animal.get('animal_type', 'unknown')
        animal_name = self.localization.translate_animal_type(animal_type)
        
        name_surface = self.font.render(animal_name, True, COLORS['grass_dark'])
        self.screen.blit(name_surface, (info_x + 20, info_y + 20))
        
        energy = animal.get('energy', 100)
        energy_surface = self.small_font.render(f'{self.localization.t("energy_cost")}: {energy}%', True, COLORS['dark_gray'])
        self.screen.blit(energy_surface, (info_x + 20, info_y + 60))
        
        release_rate = animal.get('release_success_rate', 0.5) * 100
        rate_surface = self.small_font.render(f'{self.localization.t("success_rate")}: {release_rate:.1f}%', True, COLORS['dark_gray'])
        self.screen.blit(rate_surface, (info_x + 20, info_y + 90))
        
        bar_width = info_width - 40
        bar_height = 20
        bar_x = info_x + 20
        bar_y = info_y + 130
        
        pygame.draw.rect(self.screen, COLORS['gray'], (bar_x, bar_y, bar_width, bar_height), border_radius=5)
        
        fill_width = int(bar_width * release_rate / 100)
        if fill_width > 0:
            pygame.draw.rect(self.screen, COLORS['grass_green'], (bar_x, bar_y, fill_width, bar_height), border_radius=5)
        
        pygame.draw.rect(self.screen, COLORS['dark_gray'], (bar_x, bar_y, bar_width, bar_height), width=1, border_radius=5)
    
    def _draw_training_descriptions(self):
        """绘制训练描述"""
        start_x = 50
        btn_width = 200
        btn_height = 60
        btn_spacing = 30
        btn_y = 150
        
        trainings_list = list(TRAINING_PROGRAMS.items())
        
        for i, (key, config) in enumerate(trainings_list):
            col = i % 2
            row = i // 2
            
            desc_x = start_x + col * (btn_width + btn_spacing + 100) + btn_width + 10
            desc_y = btn_y + row * (btn_height + 60)
            
            boost = config.get('success_rate_boost', 0) * 100
            energy_cost = config.get('energy_cost', 0)
            
            boost_text = f'+{boost:.0f}% {self.localization.t("success_rate")}'
            cost_text = f'-{energy_cost} {self.localization.t("energy_cost")}'
            
            boost_surface = self.small_font.render(boost_text, True, COLORS['green'])
            cost_surface = self.small_font.render(cost_text, True, COLORS['red'])
            
            self.screen.blit(boost_surface, (desc_x, desc_y + 10))
            self.screen.blit(cost_surface, (desc_x, desc_y + 35))


class ReleaseScene(Scene):
    """野放场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self.small_font = None
        self.back_btn = None
        self.release_btn = None
    
    def initialize(self):
        """初始化野放场景"""
        if self._initialized:
            return
        
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self._create_ui()
        self._initialized = True
    
    def _create_ui(self):
        """创建UI"""
        self.back_btn = Button(
            20, 20, 100, 40,
            text='← ' + self.localization.t('menu'),
            font=self.small_font,
            callback=self._on_back
        )
        self.add_component(self.back_btn)
        
        title = Label(
            SCREEN_WIDTH // 2 - 150, 30, 300, 50,
            text=self.localization.t('release_tracking'),
            font=self.font,
            text_color=COLORS['grass_dark'],
            bg_color=None,
            alignment='center'
        )
        self.add_component(title)
        
        self.release_btn = Button(
            SCREEN_WIDTH // 2 - 100, SCREEN_HEIGHT - 100, 200, 50,
            text=self.localization.t('release_to_wild'),
            font=self.font,
            callback=self._on_release
        )
        self.add_component(self.release_btn)
    
    def _on_back(self):
        """返回"""
        self.game.change_scene('game')
    
    def _on_release(self):
        """野放动物"""
        animal = self.game_state.get_selected_animal()
        if animal:
            success, message = self.game_state.release_animal(animal['id'])
            if success:
                self.game_state.add_message(message, 'success')
            else:
                self.game_state.add_message(message, 'warning')
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._on_back()
                return True
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新"""
        pass
    
    def draw(self):
        """绘制"""
        self.screen.fill(COLORS['grass_light'])
        
        self._draw_components()
        self._draw_map()
        self._draw_statistics()
        self._draw_released_animals()
    
    def _draw_map(self):
        """绘制地图"""
        map_x = 50
        map_y = 100
        map_width = SCREEN_WIDTH - 400
        map_height = SCREEN_HEIGHT - 200
        
        pygame.draw.rect(self.screen, COLORS['sky_blue'], (map_x, map_y, map_width, map_height), border_radius=10)
        pygame.draw.rect(self.screen, COLORS['wood_brown'], (map_x, map_y, map_width, map_height), width=3, border_radius=10)
        
        pygame.draw.ellipse(self.screen, COLORS['grass_green'], (map_x + 50, map_y + 50, 200, 150))
        pygame.draw.ellipse(self.screen, COLORS['leaf_green'], (map_x + map_width - 250, map_y + 100, 200, 120))
        pygame.draw.ellipse(self.screen, COLORS['grass_green'], (map_x + map_width // 2 - 100, map_y + map_height - 150, 250, 100))
        
        released_animals = self.game_state.get_released_animals()
        
        for ra in released_animals:
            norm_x = (ra['location_x'] + 180) / 360
            norm_y = (ra['location_y'] + 90) / 180
            
            dot_x = map_x + int(norm_x * map_width)
            dot_y = map_y + int(norm_y * map_height)
            
            dot_x = max(map_x + 10, min(map_x + map_width - 10, dot_x))
            dot_y = max(map_y + 10, min(map_y + map_height - 10, dot_y))
            
            color = COLORS['green'] if ra['is_alive'] else COLORS['red']
            pygame.draw.circle(self.screen, color, (dot_x, dot_y), 8)
            pygame.draw.circle(self.screen, COLORS['dark_gray'], (dot_x, dot_y), 8, 2)
    
    def _draw_statistics(self):
        """绘制统计信息"""
        stats = self.game_state.get_release_statistics()
        
        info_x = SCREEN_WIDTH - 300
        info_y = 100
        info_width = 250
        info_height = 200
        
        pygame.draw.rect(self.screen, COLORS['cream'], (info_x, info_y, info_width, info_height), border_radius=10)
        pygame.draw.rect(self.screen, COLORS['wood_brown'], (info_x, info_y, info_width, info_height), width=2, border_radius=10)
        
        title_surface = self.font.render(self.localization.t('survival_rate'), True, COLORS['grass_dark'])
        self.screen.blit(title_surface, (info_x + 20, info_y + 20))
        
        y_offset = info_y + 60
        
        released_surface = self.small_font.render(f'{self.localization.t("released")}: {stats["total_released"]}', True, COLORS['dark_gray'])
        self.screen.blit(released_surface, (info_x + 20, y_offset))
        y_offset += 25
        
        alive_surface = self.small_font.render(f'{self.localization.t("survived")}: {stats["alive"]}', True, COLORS['green'])
        self.screen.blit(alive_surface, (info_x + 20, y_offset))
        y_offset += 25
        
        deceased_surface = self.small_font.render(f'{self.localization.t("deceased")}: {stats["deceased"]}', True, COLORS['red'])
        self.screen.blit(deceased_surface, (info_x + 20, y_offset))
        y_offset += 30
        
        rate_text = f'{self.localization.t("survival_rate")}: {stats["survival_rate"]:.1f}%'
        rate_surface = self.font.render(rate_text, True, COLORS['grass_dark'])
        self.screen.blit(rate_surface, (info_x + 20, y_offset))
    
    def _draw_released_animals(self):
        """绘制已野放动物列表"""
        released_animals = self.game_state.get_released_animals()
        
        if not released_animals:
            return
        
        list_x = SCREEN_WIDTH - 300
        list_y = 320
        list_width = 250
        list_height = 300
        
        pygame.draw.rect(self.screen, COLORS['cream'], (list_x, list_y, list_width, list_height), border_radius=10)
        pygame.draw.rect(self.screen, COLORS['wood_brown'], (list_x, list_y, list_width, list_height), width=2, border_radius=10)
        
        title_surface = self.font.render(self.localization.t('released'), True, COLORS['grass_dark'])
        self.screen.blit(title_surface, (list_x + 20, list_y + 15))
        
        y_offset = list_y + 50
        for ra in released_animals[-5:]:
            animal = self.game_state.db.get_animal(ra['animal_id'])
            if animal:
                animal_type = animal.get('animal_type', 'unknown')
                animal_name = self.localization.translate_animal_type(animal_type)
                
                status_color = COLORS['green'] if ra['is_alive'] else COLORS['red']
                status_text = self.localization.t('survived') if ra['is_alive'] else self.localization.t('deceased')
                
                name_surface = self.small_font.render(animal_name, True, COLORS['dark_gray'])
                self.screen.blit(name_surface, (list_x + 20, y_offset))
                
                status_surface = self.small_font.render(status_text, True, status_color)
                self.screen.blit(status_surface, (list_x + list_width - 80, y_offset))
                
                y_offset += 30


class CageScene(Scene):
    """笼舍场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self.small_font = None
        self.back_btn = None
        self.temp_slider = None
        self.humidity_slider = None
        self.feed_btn = None
        self.selected_cage = None
    
    def initialize(self):
        """初始化笼舍场景"""
        if self._initialized:
            return
        
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self._create_ui()
        self._initialized = True
    
    def _create_ui(self):
        """创建UI"""
        self.back_btn = Button(
            20, 20, 100, 40,
            text='← ' + self.localization.t('menu'),
            font=self.small_font,
            callback=self._on_back
        )
        self.add_component(self.back_btn)
        
        title = Label(
            SCREEN_WIDTH // 2 - 150, 30, 300, 50,
            text=self.localization.t('cage_management'),
            font=self.font,
            text_color=COLORS['grass_dark'],
            bg_color=None,
            alignment='center'
        )
        self.add_component(title)
        
        control_x = SCREEN_WIDTH - 350
        control_y = 100
        control_width = 300
        control_height = 300
        
        pygame.draw.rect(self.screen, COLORS['cream'], (control_x, control_y, control_width, control_height), border_radius=10)
        
        self.temp_slider = Slider(
            control_x + 20, control_y + 80, control_width - 40, 30,
            min_value=GAME_BALANCE['min_cage_temperature'],
            max_value=GAME_BALANCE['max_cage_temperature'],
            initial_value=GAME_BALANCE['optimal_temperature'],
            bar_color=COLORS['orange'],
            bg_color=COLORS['gray'],
            handle_color=COLORS['wood_brown'],
            show_value=True,
            font=self.small_font
        )
        self.add_component(self.temp_slider)
        
        self.humidity_slider = Slider(
            control_x + 20, control_y + 180, control_width - 40, 30,
            min_value=GAME_BALANCE['min_cage_humidity'],
            max_value=GAME_BALANCE['max_cage_humidity'],
            initial_value=GAME_BALANCE['optimal_humidity'],
            bar_color=COLORS['sky_blue'],
            bg_color=COLORS['gray'],
            handle_color=COLORS['wood_brown'],
            show_value=True,
            font=self.small_font
        )
        self.add_component(self.humidity_slider)
        
        self.feed_btn = Button(
            control_x + 20, control_y + 250, control_width - 40, 40,
            text=self.localization.t('feed'),
            font=self.small_font,
            callback=self._on_feed
        )
        self.add_component(self.feed_btn)
    
    def _on_back(self):
        """返回"""
        self.game.change_scene('game')
    
    def _on_feed(self):
        """投喂"""
        animal = self.game_state.get_selected_animal()
        if animal:
            success, message = self.game_state.feed_animal(animal['id'])
            if success:
                self.game_state.add_message(message, 'success')
            else:
                self.game_state.add_message(message, 'warning')
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._on_back()
                return True
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新"""
        pass
    
    def draw(self):
        """绘制"""
        self.screen.fill(COLORS['grass_light'])
        
        self._draw_components()
        self._draw_cages()
        self._draw_controls_labels()
    
    def _draw_cages(self):
        """绘制笼舍"""
        cages = self.game_state.get_cages()
        
        cage_size = 100
        cage_spacing = 20
        start_x = 50
        start_y = 100
        
        cols = 5
        
        for i, cage in enumerate(cages):
            row = i // cols
            col = i % cols
            
            cage_x = start_x + col * (cage_size + cage_spacing)
            cage_y = start_y + row * (cage_size + cage_spacing + 30)
            
            is_occupied = cage['is_occupied']
            
            cage_color = COLORS['beige'] if is_occupied else COLORS['cream']
            pygame.draw.rect(self.screen, cage_color, (cage_x, cage_y, cage_size, cage_size), border_radius=10)
            
            border_color = COLORS['grass_green'] if is_occupied else COLORS['dark_gray']
            pygame.draw.rect(self.screen, border_color, (cage_x, cage_y, cage_size, cage_size), width=2, border_radius=10)
            
            number_surface = self.small_font.render(f'{self.localization.t("cage")} {cage["cage_number"]}', True, COLORS['dark_gray'])
            number_rect = number_surface.get_rect(center=(cage_x + cage_size // 2, cage_y + cage_size // 2 - 15))
            self.screen.blit(number_surface, number_rect)
            
            status_text = self.localization.t('occupied') if is_occupied else self.localization.t('optimal')
            status_color = COLORS['green'] if is_occupied else COLORS['gray']
            status_surface = self.small_font.render(status_text, True, status_color)
            status_rect = status_surface.get_rect(center=(cage_x + cage_size // 2, cage_y + cage_size // 2 + 15))
            self.screen.blit(status_surface, status_rect)
    
    def _draw_controls_labels(self):
        """绘制控制标签"""
        control_x = SCREEN_WIDTH - 350
        control_y = 100
        
        temp_label = self.font.render(f'{self.localization.t("temperature")} (°C)', True, COLORS['grass_dark'])
        self.screen.blit(temp_label, (control_x + 20, control_y + 20))
        
        humidity_label = self.font.render(f'{self.localization.t("humidity")} (%)', True, COLORS['grass_dark'])
        self.screen.blit(humidity_label, (control_x + 20, control_y + 120))
        
        optimal_temp = GAME_BALANCE['optimal_temperature']
        optimal_humidity = GAME_BALANCE['optimal_humidity']
        
        optimal_temp_text = f'{self.localization.t("optimal")}: {optimal_temp}°C'
        optimal_temp_surface = self.small_font.render(optimal_temp_text, True, COLORS['dark_gray'])
        self.screen.blit(optimal_temp_surface, (control_x + 20, control_y + 60))
        
        optimal_humidity_text = f'{self.localization.t("optimal")}: {optimal_humidity}%'
        optimal_humidity_surface = self.small_font.render(optimal_humidity_text, True, COLORS['dark_gray'])
        self.screen.blit(optimal_humidity_surface, (control_x + 20, control_y + 160))


class PauseScene(Scene):
    """暂停场景"""
    
    def __init__(self, game):
        super().__init__(game)
        self.font = None
        self.small_font = None
        self.resume_btn = None
        self.save_btn = None
        self.load_btn = None
        self.menu_btn = None
        self.overlay = None
    
    def initialize(self):
        """初始化暂停场景"""
        if self._initialized:
            return
        
        self.font = pygame.font.Font(None, 48)
        self.small_font = pygame.font.Font(None, 32)
        
        self.overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        self.overlay.fill((0, 0, 0, 128))
        
        self._create_ui()
        self._initialized = True
    
    def _create_ui(self):
        """创建UI"""
        panel_x = SCREEN_WIDTH // 2 - 200
        panel_y = SCREEN_HEIGHT // 2 - 200
        panel_width = 400
        panel_height = 400
        
        pygame.draw.rect(self.overlay, (*COLORS['cream'], 255), (panel_x, panel_y, panel_width, panel_height), border_radius=20)
        pygame.draw.rect(self.overlay, (*COLORS['wood_brown'], 255), (panel_x, panel_y, panel_width, panel_height), width=3, border_radius=20)
        
        title_surface = self.font.render(self.localization.t('pause_menu'), True, COLORS['grass_dark'])
        title_rect = title_surface.get_rect(center=(SCREEN_WIDTH // 2, panel_y + 50))
        self.overlay.blit(title_surface, title_rect)
        
        btn_width = 250
        btn_height = 50
        btn_x = SCREEN_WIDTH // 2 - btn_width // 2
        btn_y = panel_y + 100
        btn_spacing = 60
        
        self.resume_btn = Button(
            btn_x, btn_y, btn_width, btn_height,
            text=self.localization.t('resume'),
            font=self.small_font,
            callback=self._on_resume
        )
        self.add_component(self.resume_btn)
        
        btn_y += btn_spacing
        self.save_btn = Button(
            btn_x, btn_y, btn_width, btn_height,
            text=self.localization.t('save_game'),
            font=self.small_font,
            callback=self._on_save
        )
        self.add_component(self.save_btn)
        
        btn_y += btn_spacing
        self.load_btn = Button(
            btn_x, btn_y, btn_width, btn_height,
            text=self.localization.t('load_game'),
            font=self.small_font,
            callback=self._on_load
        )
        self.add_component(self.load_btn)
        
        if not self.game_state.has_save_game():
            self.load_btn.enabled = False
        
        btn_y += btn_spacing
        self.menu_btn = Button(
            btn_x, btn_y, btn_width, btn_height,
            text=self.localization.t('return_menu'),
            font=self.small_font,
            callback=self._on_menu
        )
        self.add_component(self.menu_btn)
    
    def _on_resume(self):
        """继续游戏"""
        self.game.change_scene('game')
    
    def _on_save(self):
        """保存游戏"""
        success, message = self.game_state.save_game()
        if success:
            self.game_state.add_message(message, 'success')
        else:
            self.game_state.add_message(message, 'warning')
    
    def _on_load(self):
        """读取游戏"""
        success, message = self.game_state.load_game()
        if success:
            self.game.change_scene('game')
            self.game_state.add_message(message, 'success')
        else:
            self.game_state.add_message(message, 'warning')
    
    def _on_menu(self):
        """返回主菜单"""
        self.game.change_scene('menu')
    
    def handle_event(self, event):
        """处理事件"""
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._on_resume()
                return True
        return self._handle_component_events(event)
    
    def update(self, dt):
        """更新"""
        pass
    
    def draw(self):
        """绘制"""
        self.screen.fill(COLORS['grass_light'])
        
        self.screen.blit(self.overlay, (0, 0))
        
        for component in self._components:
            component.draw(self.screen)
