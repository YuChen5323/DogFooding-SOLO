import pygame
from config import Colors, SCREEN_WIDTH, SCREEN_HEIGHT

class Component:
    def __init__(self, x, y, width, height):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.visible = True
        self.enabled = True
        
    def get_rect(self):
        return pygame.Rect(self.x, self.y, self.width, self.height)
    
    def is_hovered(self, mouse_pos):
        return self.get_rect().collidepoint(mouse_pos)
    
    def handle_event(self, event):
        pass
    
    def update(self, dt):
        pass
    
    def render(self, surface):
        pass

class Button(Component):
    def __init__(self, x, y, width, height, text, font, action=None, 
                 bg_color=Colors.BUTTON_NORMAL, 
                 hover_color=Colors.BUTTON_HOVER,
                 text_color=Colors.BUTTON_TEXT):
        super().__init__(x, y, width, height)
        self.text = text
        self.font = font
        self.action = action
        self.bg_color = bg_color
        self.hover_color = hover_color
        self.text_color = text_color
        self.current_color = bg_color
        self.hovered = False
        self.clicked = False
        
    def handle_event(self, event):
        if not self.visible or not self.enabled:
            return
        
        mouse_pos = pygame.mouse.get_pos()
        self.hovered = self.is_hovered(mouse_pos)
        
        if event.type == pygame.MOUSEMOTION:
            self.hovered = self.is_hovered(event.pos)
            self.current_color = self.hover_color if self.hovered else self.bg_color
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.hovered and event.button == 1:
                self.clicked = True
        
        if event.type == pygame.MOUSEBUTTONUP:
            if self.hovered and self.clicked and event.button == 1:
                if self.action:
                    self.action()
            self.clicked = False
    
    def render(self, surface):
        if not self.visible:
            return
        
        offset = 2 if self.clicked else 0
        button_rect = pygame.Rect(
            self.x + offset,
            self.y + offset,
            self.width - offset * 2,
            self.height - offset * 2
        )
        
        pygame.draw.rect(surface, self.current_color, button_rect, border_radius=4)
        pygame.draw.rect(surface, Colors.PANEL_BORDER, button_rect, 2, border_radius=4)
        
        text_surface = self.font.render(self.text, True, self.text_color)
        text_rect = text_surface.get_rect(center=button_rect.center)
        surface.blit(text_surface, text_rect)

class Label(Component):
    def __init__(self, x, y, text, font, color=Colors.TEXT, centered=False):
        self.text = text
        self.font = font
        self.color = color
        self.centered = centered
        
        text_surface = font.render(text, True, color)
        super().__init__(x, y, text_surface.get_width(), text_surface.get_height())
    
    def set_text(self, text):
        self.text = text
        text_surface = self.font.render(text, True, self.color)
        self.width = text_surface.get_width()
        self.height = text_surface.get_height()
    
    def render(self, surface):
        if not self.visible:
            return
        
        text_surface = self.font.render(self.text, True, self.color)
        
        if self.centered:
            text_rect = text_surface.get_rect(center=(self.x, self.y))
        else:
            text_rect = text_surface.get_rect(topleft=(self.x, self.y))
        
        surface.blit(text_surface, text_rect)

class Panel(Component):
    def __init__(self, x, y, width, height, bg_color=Colors.PANEL, border_color=Colors.PANEL_BORDER, border_width=2):
        super().__init__(x, y, width, height)
        self.bg_color = bg_color
        self.border_color = border_color
        self.border_width = border_width
        self.components = []
    
    def add_component(self, component):
        self.components.append(component)
    
    def handle_event(self, event):
        if not self.visible:
            return
        for component in self.components:
            component.handle_event(event)
    
    def update(self, dt):
        if not self.visible:
            return
        for component in self.components:
            component.update(dt)
    
    def render(self, surface):
        if not self.visible:
            return
        
        panel_rect = self.get_rect()
        pygame.draw.rect(surface, self.bg_color, panel_rect, border_radius=6)
        
        if self.border_width > 0:
            pygame.draw.rect(surface, self.border_color, panel_rect, self.border_width, border_radius=6)
        
        for component in self.components:
            component.render(surface)

class ResourceBar(Component):
    def __init__(self, x, y, width, height, resources, font):
        super().__init__(x, y, width, height)
        self.resources = resources
        self.font = font
        self.icon_size = 20
        self.padding = 10
    
    def update_resources(self, resources):
        self.resources = resources
    
    def render(self, surface):
        if not self.visible:
            return
        
        from config import Resources
        
        x = self.x + self.padding
        y = self.y + self.padding
        
        for res_name, amount in self.resources.items():
            color = Resources.COLORS.get(res_name, Colors.TEXT)
            name = Resources.NAMES.get(res_name, res_name)
            
            pygame.draw.rect(surface, color, (x, y, self.icon_size, self.icon_size), border_radius=3)
            
            text = f"{name}: {amount}"
            text_surface = self.font.render(text, True, Colors.TEXT)
            surface.blit(text_surface, (x + self.icon_size + 5, y))
            
            x += self.font.size(text)[0] + self.icon_size + 15
            if x > self.x + self.width - 50:
                x = self.x + self.padding
                y += 30

class HealthBar(Component):
    def __init__(self, x, y, width, height, max_health, current_health=None, 
                 bg_color=Colors.DARK_IRON, border_color=Colors.MEDIUM_IRON,
                 fill_color=Colors.ACCENT_GREEN):
        super().__init__(x, y, width, height)
        self.max_health = max_health
        self.current_health = current_health if current_health is not None else max_health
        self.bg_color = bg_color
        self.border_color = border_color
        self.fill_color = fill_color
    
    def set_health(self, current_health, max_health=None):
        self.current_health = max(0, current_health)
        if max_health is not None:
            self.max_health = max_health
    
    def render(self, surface):
        if not self.visible:
            return
        
        bar_rect = self.get_rect()
        pygame.draw.rect(surface, self.bg_color, bar_rect, border_radius=3)
        pygame.draw.rect(surface, self.border_color, bar_rect, 1, border_radius=3)
        
        if self.max_health > 0:
            health_ratio = self.current_health / self.max_health
            fill_width = int(self.width * health_ratio)
            
            if health_ratio > 0.6:
                color = Colors.ACCENT_GREEN
            elif health_ratio > 0.3:
                color = Colors.ACCENT_GOLD
            else:
                color = Colors.ACCENT_RED
            
            fill_rect = pygame.Rect(self.x + 2, self.y + 2, fill_width - 4, self.height - 4)
            pygame.draw.rect(surface, color, fill_rect, border_radius=2)

class SelectionGrid(Component):
    def __init__(self, x, y, cols, rows, item_size, padding=5):
        self.cols = cols
        self.rows = rows
        self.item_size = item_size
        self.padding = padding
        
        width = cols * (item_size + padding) + padding
        height = rows * (item_size + padding) + padding
        
        super().__init__(x, y, width, height)
        
        self.items = []
        self.selected_index = -1
        self.hovered_index = -1
    
    def add_item(self, item_data, surface=None):
        self.items.append({
            'data': item_data,
            'surface': surface
        })
    
    def get_grid_position(self, mouse_pos):
        if not self.is_hovered(mouse_pos):
            return -1
        
        local_x = mouse_pos[0] - self.x - self.padding
        local_y = mouse_pos[1] - self.y - self.padding
        
        col = int(local_x / (self.item_size + self.padding))
        row = int(local_y / (self.item_size + self.padding))
        
        if 0 <= col < self.cols and 0 <= row < self.rows:
            index = row * self.cols + col
            if index < len(self.items):
                return index
        
        return -1
    
    def get_selected_data(self):
        if 0 <= self.selected_index < len(self.items):
            return self.items[self.selected_index]['data']
        return None
    
    def handle_event(self, event):
        if not self.visible or not self.enabled:
            return
        
        mouse_pos = pygame.mouse.get_pos()
        self.hovered_index = self.get_grid_position(mouse_pos)
        
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            grid_pos = self.get_grid_position(event.pos)
            if grid_pos >= 0:
                self.selected_index = grid_pos
    
    def render(self, surface):
        if not self.visible:
            return
        
        panel_rect = self.get_rect()
        pygame.draw.rect(surface, Colors.PANEL, panel_rect, border_radius=4)
        pygame.draw.rect(surface, Colors.PANEL_BORDER, panel_rect, 2, border_radius=4)
        
        for i, item in enumerate(self.items):
            row = i // self.cols
            col = i % self.cols
            
            item_x = self.x + self.padding + col * (self.item_size + self.padding)
            item_y = self.y + self.padding + row * (self.item_size + self.padding)
            
            item_rect = pygame.Rect(item_x, item_y, self.item_size, self.item_size)
            
            if i == self.selected_index:
                pygame.draw.rect(surface, Colors.ACCENT_GOLD, item_rect, 3, border_radius=2)
            elif i == self.hovered_index:
                pygame.draw.rect(surface, Colors.LIGHT_IRON, item_rect, 1, border_radius=2)
            
            if item['surface']:
                scaled_surface = pygame.transform.scale(item['surface'], (self.item_size, self.item_size))
                surface.blit(scaled_surface, (item_x, item_y))
            elif 'data' in item and hasattr(item['data'], 'get'):
                color = item['data'].get('color', Colors.STONE)
                pygame.draw.rect(surface, color, item_rect.inflate(-4, -4), border_radius=2)
