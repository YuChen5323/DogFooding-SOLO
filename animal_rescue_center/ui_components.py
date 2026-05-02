#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
野生动物救助中心模拟经营游戏 - UI组件库
"""

import pygame
from abc import ABC, abstractmethod
from config import COLORS, BUTTON_STYLE, SCREEN_WIDTH, SCREEN_HEIGHT
from localization import LocalizationManager


class UIComponent(ABC):
    """UI组件基类"""
    
    def __init__(self, x, y, width, height):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.visible = True
        self.enabled = True
        self._hover = False
        self._pressed = False
    
    def get_rect(self):
        """获取组件矩形区域"""
        return pygame.Rect(self.x, self.y, self.width, self.height)
    
    def is_hovered(self):
        """检查鼠标是否悬停"""
        return self._hover
    
    def is_pressed(self):
        """检查是否被按下"""
        return self._pressed
    
    def handle_event(self, event):
        """处理事件"""
        if not self.visible or not self.enabled:
            return False
        
        rect = self.get_rect()
        
        if event.type == pygame.MOUSEMOTION:
            self._hover = rect.collidepoint(event.pos)
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            if rect.collidepoint(event.pos):
                self._pressed = True
                return self._on_click(event)
        
        if event.type == pygame.MOUSEBUTTONUP:
            self._pressed = False
        
        return False
    
    @abstractmethod
    def draw(self, surface):
        """绘制组件"""
        pass
    
    def _on_click(self, event):
        """点击事件处理"""
        return False


class Button(UIComponent):
    """按钮组件"""
    
    def __init__(self, x, y, width, height, text='', font=None, callback=None, 
                 style='normal', border_radius=8):
        super().__init__(x, y, width, height)
        self.text = text
        self.font = font
        self.callback = callback
        self.style = style
        self.border_radius = border_radius
        self.localization = LocalizationManager()
    
    def set_text(self, text):
        """设置按钮文字"""
        self.text = text
    
    def draw(self, surface):
        """绘制按钮"""
        if not self.visible:
            return
        
        rect = self.get_rect()
        
        if not self.enabled:
            style = BUTTON_STYLE['disabled']
        elif self._hover:
            style = BUTTON_STYLE['hover']
        else:
            style = BUTTON_STYLE['normal']
        
        pygame.draw.rect(surface, style['bg'], rect, border_radius=self.border_radius)
        pygame.draw.rect(surface, style['border'], rect, width=2, border_radius=self.border_radius)
        
        if self.font and self.text:
            text_surface = self.font.render(self.text, True, style['text'])
            text_rect = text_surface.get_rect(center=rect.center)
            surface.blit(text_surface, text_rect)
    
    def _on_click(self, event):
        """点击事件"""
        if self.callback and self.enabled:
            self.callback()
            return True
        return False


class Label(UIComponent):
    """标签组件"""
    
    def __init__(self, x, y, width, height, text='', font=None, 
                 text_color=COLORS['black'], bg_color=None, 
                 alignment='center'):
        super().__init__(x, y, width, height)
        self.text = text
        self.font = font
        self.text_color = text_color
        self.bg_color = bg_color
        self.alignment = alignment
    
    def set_text(self, text):
        """设置标签文字"""
        self.text = text
    
    def draw(self, surface):
        """绘制标签"""
        if not self.visible:
            return
        
        rect = self.get_rect()
        
        if self.bg_color:
            pygame.draw.rect(surface, self.bg_color, rect)
        
        if self.font and self.text:
            text_surface = self.font.render(self.text, True, self.text_color)
            
            if self.alignment == 'center':
                text_rect = text_surface.get_rect(center=rect.center)
            elif self.alignment == 'left':
                text_rect = text_surface.get_rect(midleft=rect.midleft)
            elif self.alignment == 'right':
                text_rect = text_surface.get_rect(midright=rect.midright)
            else:
                text_rect = text_surface.get_rect(center=rect.center)
            
            surface.blit(text_surface, text_rect)


class ProgressBar(UIComponent):
    """进度条组件"""
    
    def __init__(self, x, y, width, height, value=0.0, max_value=100.0,
                 bar_color=COLORS['grass_green'], bg_color=COLORS['gray'],
                 border_color=COLORS['grass_dark'], show_text=True,
                 font=None, text_color=COLORS['white']):
        super().__init__(x, y, width, height)
        self.value = value
        self.max_value = max_value
        self.bar_color = bar_color
        self.bg_color = bg_color
        self.border_color = border_color
        self.show_text = show_text
        self.font = font
        self.text_color = text_color
    
    def set_value(self, value):
        """设置进度值"""
        self.value = max(0.0, min(self.max_value, value))
    
    def get_percentage(self):
        """获取百分比"""
        return (self.value / self.max_value) * 100 if self.max_value > 0 else 0
    
    def draw(self, surface):
        """绘制进度条"""
        if not self.visible:
            return
        
        rect = self.get_rect()
        
        pygame.draw.rect(surface, self.bg_color, rect, border_radius=5)
        
        fill_ratio = self.value / self.max_value if self.max_value > 0 else 0
        fill_width = int(self.width * fill_ratio)
        
        if fill_width > 0:
            fill_rect = pygame.Rect(self.x, self.y, fill_width, self.height)
            pygame.draw.rect(surface, self.bar_color, fill_rect, border_radius=5)
        
        pygame.draw.rect(surface, self.border_color, rect, width=2, border_radius=5)
        
        if self.show_text and self.font:
            percentage = self.get_percentage()
            text = f'{percentage:.0f}%'
            text_surface = self.font.render(text, True, self.text_color)
            text_rect = text_surface.get_rect(center=rect.center)
            surface.blit(text_surface, text_rect)


class Panel(UIComponent):
    """面板组件"""
    
    def __init__(self, x, y, width, height, bg_color=COLORS['cream'],
                 border_color=COLORS['wood_brown'], border_width=2,
                 border_radius=10):
        super().__init__(x, y, width, height)
        self.bg_color = bg_color
        self.border_color = border_color
        self.border_width = border_width
        self.border_radius = border_radius
        self._components = []
    
    def add_component(self, component):
        """添加子组件"""
        self._components.append(component)
    
    def remove_component(self, component):
        """移除子组件"""
        if component in self._components:
            self._components.remove(component)
    
    def handle_event(self, event):
        """处理事件"""
        if not self.visible:
            return False
        
        for component in reversed(self._components):
            if component.handle_event(event):
                return True
        
        return super().handle_event(event)
    
    def draw(self, surface):
        """绘制面板"""
        if not self.visible:
            return
        
        rect = self.get_rect()
        
        if self.bg_color:
            pygame.draw.rect(surface, self.bg_color, rect, border_radius=self.border_radius)
        
        if self.border_color and self.border_width > 0:
            pygame.draw.rect(surface, self.border_color, rect, 
                           width=self.border_width, border_radius=self.border_radius)
        
        for component in self._components:
            component.draw(surface)


class ImageButton(Button):
    """图片按钮"""
    
    def __init__(self, x, y, width, height, image=None, image_hover=None,
                 text='', font=None, callback=None, border_radius=8):
        super().__init__(x, y, width, height, text, font, callback, 
                        'normal', border_radius)
        self.image = image
        self.image_hover = image_hover
        self._scaled_image = None
        self._scaled_image_hover = None
        
        if self.image:
            self._scale_images()
    
    def _scale_images(self):
        """缩放图片"""
        if self.image:
            self._scaled_image = pygame.transform.scale(self.image, (self.width - 10, self.height - 10))
        if self.image_hover:
            self._scaled_image_hover = pygame.transform.scale(self.image_hover, (self.width - 10, self.height - 10))
    
    def set_image(self, image, image_hover=None):
        """设置图片"""
        self.image = image
        self.image_hover = image_hover
        self._scale_images()
    
    def draw(self, surface):
        """绘制图片按钮"""
        if not self.visible:
            return
        
        rect = self.get_rect()
        
        if self._hover and self._scaled_image_hover:
            super().draw(surface)
            img_rect = self._scaled_image_hover.get_rect(center=rect.center)
            surface.blit(self._scaled_image_hover, img_rect)
        elif self._scaled_image:
            super().draw(surface)
            img_rect = self._scaled_image.get_rect(center=rect.center)
            surface.blit(self._scaled_image, img_rect)
        else:
            super().draw(surface)


class AnimalCard(UIComponent):
    """动物卡片组件"""
    
    def __init__(self, x, y, width, height, animal_data=None, font=None,
                 callback=None):
        super().__init__(x, y, width, height)
        self.animal_data = animal_data
        self.font = font
        self.small_font = None
        self.callback = callback
        self.localization = LocalizationManager()
        self._selected = False
    
    def set_animal(self, animal_data):
        """设置动物数据"""
        self.animal_data = animal_data
    
    def set_selected(self, selected):
        """设置选中状态"""
        self._selected = selected
    
    def is_selected(self):
        """获取选中状态"""
        return self._selected
    
    def _get_animal_color(self, animal_type):
        """获取动物颜色"""
        animal_colors = {
            'panda': (255, 255, 255),
            'tiger': (255, 140, 0),
            'deer': (205, 133, 63),
            'eagle': (139, 69, 19),
            'owl': (101, 67, 33),
            'rabbit': (240, 240, 240),
            'fox': (255, 100, 0),
            'turtle': (85, 107, 47)
        }
        return animal_colors.get(animal_type, (150, 150, 150))
    
    def _get_health_color(self, health):
        """获取健康状态颜色"""
        if health >= 70:
            return COLORS['green']
        elif health >= 40:
            return COLORS['yellow']
        else:
            return COLORS['red']
    
    def _on_click(self, event):
        """点击事件"""
        if self.callback and self.animal_data:
            self.callback(self.animal_data)
            return True
        return False
    
    def draw(self, surface):
        """绘制动物卡片"""
        if not self.visible or not self.animal_data:
            return
        
        rect = self.get_rect()
        
        bg_color = COLORS['cream']
        border_color = COLORS['wood_brown']
        
        if self._selected:
            bg_color = COLORS['grass_light']
            border_color = COLORS['grass_green']
        elif self._hover:
            bg_color = COLORS['beige']
        
        pygame.draw.rect(surface, bg_color, rect, border_radius=10)
        pygame.draw.rect(surface, border_color, rect, width=2, border_radius=10)
        
        animal_type = self.animal_data.get('animal_type', 'unknown')
        animal_name = self.localization.translate_animal_type(animal_type)
        
        icon_radius = 25
        icon_center = (self.x + 35, self.y + 35)
        animal_color = self._get_animal_color(animal_type)
        pygame.draw.circle(surface, animal_color, icon_center, icon_radius)
        pygame.draw.circle(surface, border_color, icon_center, icon_radius, width=2)
        
        if self.font:
            name_surface = self.font.render(animal_name, True, COLORS['black'])
            name_x = self.x + 70
            name_y = self.y + 25
            surface.blit(name_surface, (name_x, name_y))
            
            rarity = self.animal_data.get('rarity', 'common')
            rarity_text = self.localization.translate_rarity(rarity)
            
            if self.small_font:
                rarity_surface = self.small_font.render(rarity_text, True, COLORS['dark_gray'])
                surface.blit(rarity_surface, (name_x, name_y + 20))
        
        health = self.animal_data.get('health', 50)
        hunger = self.animal_data.get('hunger', 50)
        happiness = self.animal_data.get('happiness', 50)
        
        bar_width = self.width - 80
        bar_height = 12
        bar_x = self.x + 70
        bar_y = self.y + 60
        bar_spacing = 15
        
        health_color = self._get_health_color(health)
        self._draw_small_bar(surface, bar_x, bar_y, bar_width, bar_height, health, health_color, 'H')
        
        bar_y += bar_spacing
        self._draw_small_bar(surface, bar_x, bar_y, bar_width, bar_height, hunger, COLORS['orange'], 'F')
        
        bar_y += bar_spacing
        self._draw_small_bar(surface, bar_x, bar_y, bar_width, bar_height, happiness, COLORS['purple'], 'H')
    
    def _draw_small_bar(self, surface, x, y, width, height, value, color, label):
        """绘制小型进度条"""
        bg_rect = pygame.Rect(x, y, width, height)
        pygame.draw.rect(surface, COLORS['gray'], bg_rect, border_radius=3)
        
        fill_width = int(width * value / 100)
        if fill_width > 0:
            fill_rect = pygame.Rect(x, y, fill_width, height)
            pygame.draw.rect(surface, color, fill_rect, border_radius=3)
        
        pygame.draw.rect(surface, COLORS['dark_gray'], bg_rect, width=1, border_radius=3)


class MessageBox(Panel):
    """消息对话框"""
    
    def __init__(self, x, y, width, height, message='', title='',
                 font=None, buttons=None, callback=None):
        super().__init__(x, y, width, height, COLORS['cream'], COLORS['wood_brown'], 3, 15)
        self.message = message
        self.title = title
        self.font = font
        self.small_font = None
        self.buttons_config = buttons or [('OK', None)]
        self.callback = callback
        self.localization = LocalizationManager()
        self.result = None
        self._create_buttons()
    
    def _create_buttons(self):
        """创建按钮"""
        button_width = 100
        button_height = 40
        button_spacing = 20
        total_width = len(self.buttons_config) * button_width + (len(self.buttons_config) - 1) * button_spacing
        
        start_x = self.x + (self.width - total_width) // 2
        button_y = self.y + self.height - 70
        
        for i, (text, value) in enumerate(self.buttons_config):
            button_x = start_x + i * (button_width + button_spacing)
            
            def make_callback(v=value):
                return lambda: self._on_button_click(v)
            
            button = Button(
                button_x, button_y, button_width, button_height,
                text=text, font=self.font, callback=make_callback()
            )
            self.add_component(button)
    
    def _on_button_click(self, value):
        """按钮点击处理"""
        self.result = value
        self.visible = False
        if self.callback:
            self.callback(value)
    
    def show(self):
        """显示对话框"""
        self.visible = True
        self.result = None
    
    def hide(self):
        """隐藏对话框"""
        self.visible = False
    
    def draw(self, surface):
        """绘制对话框"""
        if not self.visible:
            return
        
        super().draw(surface)
        
        if self.title and self.font:
            title_surface = self.font.render(self.title, True, COLORS['black'])
            title_rect = title_surface.get_rect(center=(self.x + self.width // 2, self.y + 30))
            surface.blit(title_surface, title_rect)
            
            pygame.draw.line(surface, COLORS['wood_brown'],
                           (self.x + 30, self.y + 50),
                           (self.x + self.width - 30, self.y + 50), 2)
        
        if self.message and self.font:
            lines = self._wrap_text(self.message, self.width - 60)
            y_offset = 80 if self.title else 40
            
            for line in lines:
                text_surface = self.font.render(line, True, COLORS['dark_gray'])
                text_rect = text_surface.get_rect(center=(self.x + self.width // 2, self.y + y_offset))
                surface.blit(text_surface, text_rect)
                y_offset += 30
    
    def _wrap_text(self, text, max_width):
        """文本换行"""
        if not self.font:
            return [text]
        
        words = text.split(' ')
        lines = []
        current_line = ''
        
        for word in words:
            test_line = current_line + ' ' + word if current_line else word
            test_surface = self.font.render(test_line, True, COLORS['black'])
            
            if test_surface.get_width() <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        return lines


class ScrollPanel(Panel):
    """滚动面板"""
    
    def __init__(self, x, y, width, height, bg_color=COLORS['cream'],
                 border_color=COLORS['wood_brown'], border_width=2,
                 border_radius=10):
        super().__init__(x, y, width, height, bg_color, border_color, border_width, border_radius)
        self.scroll_y = 0
        self.scroll_speed = 20
        self._content_height = 0
        self._scrollbar_width = 15
        self._dragging_scrollbar = False
        self._scrollbar_rect = None
    
    def set_content_height(self, height):
        """设置内容高度"""
        self._content_height = height
    
    def handle_event(self, event):
        """处理事件"""
        if not self.visible:
            return False
        
        rect = self.get_rect()
        
        if event.type == pygame.MOUSEWHEEL and rect.collidepoint(event.pos):
            max_scroll = max(0, self._content_height - self.height)
            self.scroll_y = max(0, min(max_scroll, self.scroll_y - event.y * self.scroll_speed))
            return True
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self._scrollbar_rect and self._scrollbar_rect.collidepoint(event.pos):
                self._dragging_scrollbar = True
                return True
        
        if event.type == pygame.MOUSEBUTTONUP:
            self._dragging_scrollbar = False
        
        if event.type == pygame.MOUSEMOTION and self._dragging_scrollbar:
            if self._content_height > self.height:
                ratio = self.height / self._content_height
                bar_height = self.height * ratio
                max_bar_y = self.y + self.height - bar_height
                
                new_bar_y = event.pos[1] - bar_height // 2
                new_bar_y = max(self.y, min(max_bar_y, new_bar_y))
                
                scroll_ratio = (new_bar_y - self.y) / (self.height - bar_height)
                max_scroll = self._content_height - self.height
                self.scroll_y = max_scroll * scroll_ratio
            return True
        
        adjusted_event = self._adjust_event(event)
        return super().handle_event(adjusted_event)
    
    def _adjust_event(self, event):
        """调整事件坐标以适应滚动"""
        if event.type in [pygame.MOUSEMOTION, pygame.MOUSEBUTTONDOWN, pygame.MOUSEBUTTONUP]:
            adjusted_pos = (event.pos[0], event.pos[1] + self.scroll_y)
            adjusted_event = pygame.event.Event(event.type, pos=adjusted_pos, button=getattr(event, 'button', 1))
            return adjusted_event
        return event
    
    def draw(self, surface):
        """绘制滚动面板"""
        if not self.visible:
            return
        
        rect = self.get_rect()
        
        clip_rect = pygame.Rect(self.x, self.y, self.width - self._scrollbar_width, self.height)
        surface.set_clip(clip_rect)
        
        if self.bg_color:
            pygame.draw.rect(surface, self.bg_color, rect, border_radius=self.border_radius)
        
        temp_surface = surface.copy()
        temp_surface.set_clip(None)
        
        for component in self._components:
            if hasattr(component, 'y'):
                original_y = component.y
                component.y -= self.scroll_y
                component.draw(temp_surface)
                component.y = original_y
        
        surface.set_clip(None)
        surface.blit(temp_surface, (0, 0))
        
        if self._content_height > self.height:
            ratio = self.height / self._content_height
            bar_height = self.height * ratio
            bar_x = self.x + self.width - self._scrollbar_width
            max_bar_y = self.y + self.height - bar_height
            scroll_ratio = self.scroll_y / (self._content_height - self.height) if self._content_height > self.height else 0
            bar_y = self.y + scroll_ratio * (self.height - bar_height)
            
            self._scrollbar_rect = pygame.Rect(bar_x, bar_y, self._scrollbar_width, bar_height)
            pygame.draw.rect(surface, COLORS['grass_light'], self._scrollbar_rect, border_radius=5)
            pygame.draw.rect(surface, COLORS['grass_dark'], self._scrollbar_rect, width=2, border_radius=5)
        
        pygame.draw.rect(surface, self.border_color, rect, width=self.border_width, border_radius=self.border_radius)


class TextInput(UIComponent):
    """文本输入框"""
    
    def __init__(self, x, y, width, height, font=None, text='',
                 text_color=COLORS['black'], bg_color=COLORS['white'],
                 border_color=COLORS['grass_dark'], max_length=20):
        super().__init__(x, y, width, height)
        self.font = font
        self.text = text
        self.text_color = text_color
        self.bg_color = bg_color
        self.border_color = border_color
        self.max_length = max_length
        self._active = False
        self._cursor_visible = True
        self._cursor_timer = 0
        self._cursor_position = len(text)
    
    def set_active(self, active):
        """设置激活状态"""
        self._active = active
    
    def is_active(self):
        """获取激活状态"""
        return self._active
    
    def get_text(self):
        """获取文本"""
        return self.text
    
    def set_text(self, text):
        """设置文本"""
        self.text = text[:self.max_length] if text else ''
        self._cursor_position = len(self.text)
    
    def handle_event(self, event):
        """处理事件"""
        if not self.visible or not self.enabled:
            return False
        
        rect = self.get_rect()
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            was_active = self._active
            self._active = rect.collidepoint(event.pos)
            if self._active and not was_active:
                self._cursor_position = len(self.text)
            return self._active
        
        if event.type == pygame.KEYDOWN and self._active:
            if event.key == pygame.K_BACKSPACE:
                if self._cursor_position > 0:
                    self.text = self.text[:self._cursor_position-1] + self.text[self._cursor_position:]
                    self._cursor_position -= 1
            elif event.key == pygame.K_DELETE:
                if self._cursor_position < len(self.text):
                    self.text = self.text[:self._cursor_position] + self.text[self._cursor_position+1:]
            elif event.key == pygame.K_LEFT:
                self._cursor_position = max(0, self._cursor_position - 1)
            elif event.key == pygame.K_RIGHT:
                self._cursor_position = min(len(self.text), self._cursor_position + 1)
            elif event.key == pygame.K_HOME:
                self._cursor_position = 0
            elif event.key == pygame.K_END:
                self._cursor_position = len(self.text)
            elif event.key in [pygame.K_RETURN, pygame.K_KP_ENTER]:
                return True
            elif event.unicode and len(self.text) < self.max_length:
                if event.unicode.isprintable():
                    self.text = self.text[:self._cursor_position] + event.unicode + self.text[self._cursor_position:]
                    self._cursor_position += 1
            return True
        
        return False
    
    def update(self, dt):
        """更新光标闪烁"""
        self._cursor_timer += dt
        if self._cursor_timer >= 500:
            self._cursor_visible = not self._cursor_visible
            self._cursor_timer = 0
    
    def draw(self, surface):
        """绘制文本框"""
        if not self.visible:
            return
        
        rect = self.get_rect()
        
        pygame.draw.rect(surface, self.bg_color, rect, border_radius=5)
        
        border_color = COLORS['grass_green'] if self._active else self.border_color
        pygame.draw.rect(surface, border_color, rect, width=2, border_radius=5)
        
        if self.font and self.text:
            text_surface = self.font.render(self.text, True, self.text_color)
            text_rect = text_surface.get_rect(midleft=(self.x + 10, rect.centery))
            surface.blit(text_surface, text_rect)
            
            if self._active and self._cursor_visible:
                cursor_x = self.x + 10 + self.font.size(self.text[:self._cursor_position])[0]
                cursor_height = self.height - 8
                pygame.draw.line(surface, self.text_color,
                               (cursor_x, self.y + 4),
                               (cursor_x, self.y + 4 + cursor_height), 2)


class Slider(UIComponent):
    """滑块组件"""
    
    def __init__(self, x, y, width, height, min_value=0, max_value=100,
                 initial_value=50, bar_color=COLORS['grass_green'],
                 bg_color=COLORS['gray'], handle_color=COLORS['grass_dark'],
                 show_value=True, font=None, text_color=COLORS['black']):
        super().__init__(x, y, width, height)
        self.min_value = min_value
        self.max_value = max_value
        self._value = initial_value
        self.bar_color = bar_color
        self.bg_color = bg_color
        self.handle_color = handle_color
        self.show_value = show_value
        self.font = font
        self.text_color = text_color
        self._dragging = False
        self._handle_radius = height // 2 + 2
    
    def get_value(self):
        """获取当前值"""
        return self._value
    
    def set_value(self, value):
        """设置值"""
        self._value = max(self.min_value, min(self.max_value, value))
    
    def _get_handle_x(self):
        """获取滑块位置"""
        ratio = (self._value - self.min_value) / (self.max_value - self.min_value)
        return self.x + int(ratio * (self.width - self._handle_radius * 2)) + self._handle_radius
    
    def handle_event(self, event):
        """处理事件"""
        if not self.visible or not self.enabled:
            return False
        
        handle_x = self._get_handle_x()
        handle_rect = pygame.Rect(handle_x - self._handle_radius, self.y,
                                  self._handle_radius * 2, self.height)
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            if handle_rect.collidepoint(event.pos):
                self._dragging = True
                return True
            elif self.get_rect().collidepoint(event.pos):
                self._dragging = True
                self._update_value_from_pos(event.pos[0])
                return True
        
        if event.type == pygame.MOUSEBUTTONUP:
            self._dragging = False
        
        if event.type == pygame.MOUSEMOTION and self._dragging:
            self._update_value_from_pos(event.pos[0])
            return True
        
        return False
    
    def _update_value_from_pos(self, x):
        """根据鼠标位置更新值"""
        clamped_x = max(self.x, min(self.x + self.width, x))
        ratio = (clamped_x - self.x) / self.width
        new_value = self.min_value + ratio * (self.max_value - self.min_value)
        self._value = max(self.min_value, min(self.max_value, new_value))
    
    def draw(self, surface):
        """绘制滑块"""
        if not self.visible:
            return
        
        rect = self.get_rect()
        
        bar_height = max(4, self.height // 3)
        bar_y = self.y + (self.height - bar_height) // 2
        bar_rect = pygame.Rect(self.x, bar_y, self.width, bar_height)
        
        pygame.draw.rect(surface, self.bg_color, bar_rect, border_radius=bar_height // 2)
        
        handle_x = self._get_handle_x()
        fill_width = handle_x - self.x
        if fill_width > 0:
            fill_rect = pygame.Rect(self.x, bar_y, fill_width, bar_height)
            pygame.draw.rect(surface, self.bar_color, fill_rect, border_radius=bar_height // 2)
        
        handle_center = (handle_x, self.y + self.height // 2)
        pygame.draw.circle(surface, self.handle_color, handle_center, self._handle_radius)
        
        if self._dragging or self.is_hovered():
            pygame.draw.circle(surface, COLORS['grass_light'], handle_center, self._handle_radius - 3)
        
        if self.show_value and self.font:
            value_text = f'{self._value:.1f}'
            text_surface = self.font.render(value_text, True, self.text_color)
            text_rect = text_surface.get_rect(center=(self.x + self.width // 2, self.y - 20))
            surface.blit(text_surface, text_rect)
