import math
from enum import Enum
from dataclasses import dataclass, asdict, field
from typing import Dict, List, Tuple, Optional, Any, Callable
import json
import os

import pygame
import pymunk

from .config import NEON_COLORS


class GameState(Enum):
    MENU = "menu"
    HANGAR = "hangar"
    TRAINING = "training"
    FORMATION_EDITOR = "formation_editor"
    PLAYBACK = "playback"
    EXIT = "exit"


@dataclass
class Module:
    id: str
    name: str
    module_type: str
    relative_x: float
    relative_y: float
    width: float
    height: float
    mass: float
    density: float
    color: Tuple[int, int, int]
    properties: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Module':
        return cls(**data)


@dataclass
class ShipDesign:
    id: str
    name: str
    modules: List[Module]
    total_mass: float = 0.0
    center_of_mass: Tuple[float, float] = (0.0, 0.0)
    moment_of_inertia: float = 0.0
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'modules': [m.to_dict() for m in self.modules],
            'total_mass': self.total_mass,
            'center_of_mass': self.center_of_mass,
            'moment_of_inertia': self.moment_of_inertia
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ShipDesign':
        modules = [Module.from_dict(m) for m in data.get('modules', [])]
        return cls(
            id=data['id'],
            name=data['name'],
            modules=modules,
            total_mass=data.get('total_mass', 0.0),
            center_of_mass=tuple(data.get('center_of_mass', (0.0, 0.0))),
            moment_of_inertia=data.get('moment_of_inertia', 0.0)
        )


@dataclass
class Keyframe:
    time: float
    position: Tuple[float, float]
    angle: float
    interpolation: str = 'linear'
    
    def to_dict(self) -> Dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Keyframe':
        return cls(
            time=data['time'],
            position=tuple(data['position']),
            angle=data['angle'],
            interpolation=data.get('interpolation', 'linear')
        )


@dataclass
class FormationShip:
    ship_id: str
    ship_design_id: str
    keyframes: List[Keyframe]
    
    def to_dict(self) -> Dict:
        return {
            'ship_id': self.ship_id,
            'ship_design_id': self.ship_design_id,
            'keyframes': [k.to_dict() for k in self.keyframes]
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'FormationShip':
        keyframes = [Keyframe.from_dict(k) for k in data.get('keyframes', [])]
        return cls(
            ship_id=data['ship_id'],
            ship_design_id=data['ship_design_id'],
            keyframes=keyframes
        )


@dataclass
class FormationScript:
    id: str
    name: str
    ships: List[FormationShip]
    total_duration: float = 0.0
    audio_track: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'ships': [s.to_dict() for s in self.ships],
            'total_duration': self.total_duration,
            'audio_track': self.audio_track
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'FormationScript':
        ships = [FormationShip.from_dict(s) for s in data.get('ships', [])]
        return cls(
            id=data['id'],
            name=data['name'],
            ships=ships,
            total_duration=data.get('total_duration', 0.0),
            audio_track=data.get('audio_track')
        )


class PhysicsCalculator:
    @staticmethod
    def calculate_ship_properties(modules: List[Module]) -> Tuple[float, Tuple[float, float], float]:
        total_mass = 0.0
        com_x = 0.0
        com_y = 0.0
        
        for module in modules:
            module_mass = module.mass
            if module_mass <= 0:
                module_mass = module.width * module.height * module.density
            
            total_mass += module_mass
            com_x += module.relative_x * module_mass
            com_y += module.relative_y * module_mass
        
        if total_mass > 0:
            com_x /= total_mass
            com_y /= total_mass
        
        moi = 0.0
        for module in modules:
            module_mass = module.mass if module.mass > 0 else module.width * module.height * module.density
            dx = module.relative_x - com_x
            dy = module.relative_y - com_y
            parallel_axis = module_mass * (dx * dx + dy * dy)
            box_moi = module_mass * (module.width ** 2 + module.height ** 2) / 12
            moi += parallel_axis + box_moi
        
        return total_mass, (com_x, com_y), moi
    
    @staticmethod
    def create_pymunk_body(ship_design: ShipDesign, position: Tuple[float, float]) -> Tuple[pymunk.Body, List[pymunk.Shape]]:
        mass = ship_design.total_mass
        moi = ship_design.moment_of_inertia
        
        if mass <= 0:
            mass = 1.0
        if moi <= 0:
            moi = 100.0
        
        body = pymunk.Body(mass, moi)
        body.position = position
        
        shapes = []
        com_x, com_y = ship_design.center_of_mass
        
        for module in ship_design.modules:
            local_x = module.relative_x - com_x
            local_y = module.relative_y - com_y
            
            half_w = module.width / 2
            half_h = module.height / 2
            
            vertices = [
                (local_x - half_w, local_y - half_h),
                (local_x + half_w, local_y - half_h),
                (local_x + half_w, local_y + half_h),
                (local_x - half_w, local_y + half_h)
            ]
            
            shape = pymunk.Poly(body, vertices)
            shape.density = module.density
            shape.elasticity = 0.3
            shape.friction = 0.5
            shape.collision_type = 1
            shape.filter = pymunk.ShapeFilter(group=1)
            shapes.append(shape)
        
        return body, shapes
    
    @staticmethod
    def create_asteroid(position: Tuple[float, float], radius: float, mass: float) -> Tuple[pymunk.Body, pymunk.Shape]:
        moi = pymunk.moment_for_circle(mass, 0, radius)
        body = pymunk.Body(mass, moi)
        body.position = position
        
        shape = pymunk.Circle(body, radius)
        shape.density = mass / (math.pi * radius * radius)
        shape.elasticity = 0.8
        shape.friction = 0.3
        shape.collision_type = 2
        
        return body, shape


class DataManager:
    SAVE_DIR = "saves"
    DESIGNS_DIR = "saves/designs"
    FORMATIONS_DIR = "saves/formations"
    
    @classmethod
    def ensure_directories(cls):
        os.makedirs(cls.SAVE_DIR, exist_ok=True)
        os.makedirs(cls.DESIGNS_DIR, exist_ok=True)
        os.makedirs(cls.FORMATIONS_DIR, exist_ok=True)
    
    @classmethod
    def save_ship_design(cls, design: ShipDesign) -> str:
        cls.ensure_directories()
        filepath = os.path.join(cls.DESIGNS_DIR, f"{design.id}.json")
        with open(filepath, 'w') as f:
            json.dump(design.to_dict(), f, indent=2)
        return filepath
    
    @classmethod
    def load_ship_design(cls, design_id: str) -> Optional[ShipDesign]:
        filepath = os.path.join(cls.DESIGNS_DIR, f"{design_id}.json")
        if not os.path.exists(filepath):
            return None
        with open(filepath, 'r') as f:
            data = json.load(f)
        return ShipDesign.from_dict(data)
    
    @classmethod
    def list_ship_designs(cls) -> List[str]:
        cls.ensure_directories()
        designs = []
        for filename in os.listdir(cls.DESIGNS_DIR):
            if filename.endswith('.json'):
                designs.append(filename[:-5])
        return designs
    
    @classmethod
    def save_formation_script(cls, script: FormationScript) -> str:
        cls.ensure_directories()
        filepath = os.path.join(cls.FORMATIONS_DIR, f"{script.id}.json")
        with open(filepath, 'w') as f:
            json.dump(script.to_dict(), f, indent=2)
        return filepath
    
    @classmethod
    def load_formation_script(cls, script_id: str) -> Optional[FormationScript]:
        filepath = os.path.join(cls.FORMATIONS_DIR, f"{script_id}.json")
        if not os.path.exists(filepath):
            return None
        with open(filepath, 'r') as f:
            data = json.load(f)
        return FormationScript.from_dict(data)
    
    @classmethod
    def list_formation_scripts(cls) -> List[str]:
        cls.ensure_directories()
        scripts = []
        for filename in os.listdir(cls.FORMATIONS_DIR):
            if filename.endswith('.json'):
                scripts.append(filename[:-5])
        return scripts


class NeonRenderer:
    @staticmethod
    def draw_neon_line(surface: pygame.Surface, start: Tuple[int, int], end: Tuple[int, int], 
                       color: Tuple[int, int, int], thickness: int = 3):
        offsets = [(0, 0), (-1, 0), (1, 0), (0, -1), (0, 1)]
        for dx, dy in offsets:
            alpha = 255 if (dx, dy) == (0, 0) else 100
            pygame.draw.line(surface, (*color, alpha), 
                           (start[0] + dx, start[1] + dy), 
                           (end[0] + dx, end[1] + dy), 
                           thickness)
    
    @staticmethod
    def draw_neon_rect(surface: pygame.Surface, rect: pygame.Rect, 
                       color: Tuple[int, int, int], thickness: int = 2, fill: bool = False):
        if fill:
            pygame.draw.rect(surface, (*color, 30), rect)
        
        points = [
            (rect.x, rect.y),
            (rect.x + rect.width, rect.y),
            (rect.x + rect.width, rect.y + rect.height),
            (rect.x, rect.y + rect.height)
        ]
        
        for i in range(4):
            NeonRenderer.draw_neon_line(surface, points[i], points[(i + 1) % 4], color, thickness)
    
    @staticmethod
    def draw_neon_circle(surface: pygame.Surface, center: Tuple[int, int], radius: int,
                         color: Tuple[int, int, int], thickness: int = 2):
        temp_surf = pygame.Surface((radius * 2 + 4, radius * 2 + 4), pygame.SRCALPHA)
        temp_center = (radius + 2, radius + 2)
        
        pygame.draw.circle(temp_surf, (*color, 50), temp_center, radius + 2)
        pygame.draw.circle(temp_surf, (*color, 100), temp_center, radius + 1)
        pygame.draw.circle(temp_surf, color, temp_center, radius, thickness)
        
        surface.blit(temp_surf, (center[0] - radius - 2, center[1] - radius - 2))
    
    @staticmethod
    def draw_neon_text(surface: pygame.Surface, text: str, font: pygame.font.Font,
                      position: Tuple[int, int], color: Tuple[int, int, int], 
                      center: bool = True):
        text_surface = font.render(text, True, color)
        glow_surface = font.render(text, True, (*color, 100))
        
        if center:
            text_rect = text_surface.get_rect(center=position)
        else:
            text_rect = text_surface.get_rect(topleft=position)
        
        offsets = [(-1, -1), (1, -1), (-1, 1), (1, 1),
                   (-2, 0), (2, 0), (0, -2), (0, 2)]
        for dx, dy in offsets:
            surface.blit(glow_surface, (text_rect.x + dx, text_rect.y + dy))
        
        surface.blit(text_surface, text_rect)
        return text_rect


class Button:
    def __init__(self, x: int, y: int, width: int, height: int, text: str, 
                 action: Optional[Callable] = None, color: Tuple[int, int, int] = NEON_COLORS['cyan']):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.action = action
        self.color = color
        self.hover_color = tuple(min(255, c + 50) for c in color)
        self.is_hovered = False
    
    def handle_event(self, event: pygame.event.Event) -> bool:
        if event.type == pygame.MOUSEMOTION:
            self.is_hovered = self.rect.collidepoint(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1 and self.rect.collidepoint(event.pos):
                if self.action:
                    self.action()
                return True
        return False
    
    def draw(self, surface: pygame.Surface, font: pygame.font.Font):
        color = self.hover_color if self.is_hovered else self.color
        
        if self.is_hovered:
            pygame.draw.rect(surface, (*color, 40), self.rect)
        
        NeonRenderer.draw_neon_rect(surface, self.rect, color, thickness=2)
        
        text_surface = font.render(self.text, True, color)
        text_rect = text_surface.get_rect(center=self.rect.center)
        surface.blit(text_surface, text_rect)


class InputBox:
    def __init__(self, x: int, y: int, width: int, height: int, 
                 default_text: str = "", label: str = ""):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = default_text
        self.label = label
        self.active = False
        self.color = NEON_COLORS['cyan']
        self.cursor_visible = True
        self.cursor_timer = 0
    
    def handle_event(self, event: pygame.event.Event) -> bool:
        if event.type == pygame.MOUSEBUTTONDOWN:
            self.active = self.rect.collidepoint(event.pos)
            self.color = NEON_COLORS['magenta'] if self.active else NEON_COLORS['cyan']
        elif event.type == pygame.KEYDOWN and self.active:
            if event.key == pygame.K_RETURN:
                self.active = False
                self.color = NEON_COLORS['cyan']
                return True
            elif event.key == pygame.K_BACKSPACE:
                self.text = self.text[:-1]
            else:
                if len(self.text) < 30:
                    self.text += event.unicode
        return False
    
    def update(self):
        self.cursor_timer += 1
        if self.cursor_timer > 30:
            self.cursor_visible = not self.cursor_visible
            self.cursor_timer = 0
    
    def draw(self, surface: pygame.Surface, font: pygame.font.Font):
        if self.label:
            label_surface = font.render(self.label, True, NEON_COLORS['white'])
            surface.blit(label_surface, (self.rect.x, self.rect.y - 25))
        
        pygame.draw.rect(surface, NEON_COLORS['menu_bg'], self.rect)
        NeonRenderer.draw_neon_rect(surface, self.rect, self.color, thickness=2)
        
        display_text = self.text
        if self.active and self.cursor_visible:
            display_text += "|"
        
        text_surface = font.render(display_text, True, self.color)
        surface.blit(text_surface, (self.rect.x + 5, self.rect.y + 5))
