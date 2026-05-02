import pygame
import pymunk
import uuid
import math
from typing import Dict, List, Tuple, Optional, Any
import numpy as np

from .config import SCREEN_WIDTH, SCREEN_HEIGHT, NEON_COLORS, MODULE_PRESETS
from .core import (
    FormationScript, FormationShip, Keyframe,
    ShipDesign, DataManager, NeonRenderer, Button, InputBox, GameState, Module
)


class FormationEditor:
    def __init__(self, screen: pygame.Surface, clock: pygame.time.Clock):
        self.screen = screen
        self.clock = clock
        self.running = True
        self.next_state: Optional[GameState] = None
        
        self.font_large = pygame.font.Font(None, 48)
        self.font_medium = pygame.font.Font(None, 36)
        self.font_small = pygame.font.Font(None, 24)
        
        self.edit_area_rect = pygame.Rect(250, 80, SCREEN_WIDTH - 500, SCREEN_HEIGHT - 200)
        
        self.current_script: FormationScript = FormationScript(
            id=str(uuid.uuid4())[:8],
            name="新编队",
            ships=[]
        )
        
        self.selected_ship_idx: Optional[int] = None
        self.dragging_ship: Optional[int] = None
        self.drag_offset = (0, 0)
        
        self.script_time = 0.0
        self.is_playing = False
        self.playback_speed = 1.0
        
        self.available_designs = DataManager.list_ship_designs()
        self.design_colors = [
            NEON_COLORS['cyan'],
            NEON_COLORS['magenta'],
            NEON_COLORS['yellow'],
            NEON_COLORS['green'],
            NEON_COLORS['pink'],
            NEON_COLORS['orange']
        ]
        
        self._init_buttons()
        
        self.script_name_input = InputBox(
            50, 50, 200, 35,
            default_text=self.current_script.name,
            label="编队名称"
        )
        
        self.message: Optional[str] = None
        self.message_timer = 0
    
    def _init_buttons(self):
        self.back_button = Button(
            SCREEN_WIDTH - 120, 20, 100, 40,
            "返回",
            color=NEON_COLORS['magenta']
        )
        
        self.save_button = Button(
            SCREEN_WIDTH - 240, 20, 100, 40,
            "保存",
            color=NEON_COLORS['green']
        )
        
        self.load_button = Button(
            SCREEN_WIDTH - 360, 20, 100, 40,
            "加载",
            color=NEON_COLORS['cyan']
        )
        
        self.play_button = Button(
            SCREEN_WIDTH // 2 - 110, SCREEN_HEIGHT - 60, 100, 40,
            "播放",
            color=NEON_COLORS['green']
        )
        
        self.pause_button = Button(
            SCREEN_WIDTH // 2 - 5, SCREEN_HEIGHT - 60, 100, 40,
            "暂停",
            color=NEON_COLORS['yellow']
        )
        
        self.reset_button = Button(
            SCREEN_WIDTH // 2 + 100, SCREEN_HEIGHT - 60, 100, 40,
            "重置",
            color=NEON_COLORS['orange']
        )
        
        btn_y = 100
        self.add_ship_buttons: List[Button] = []
        
        if self.available_designs:
            for i, design_id in enumerate(self.available_designs[:4]):
                color = self.design_colors[i % len(self.design_colors)]
                btn = Button(
                    20, btn_y, 200, 40,
                    f"添加: {design_id[:8]}",
                    color=color
                )
                btn.design_id = design_id
                btn.design_color = color
                self.add_ship_buttons.append(btn)
                btn_y += 50
        
        if not self.add_ship_buttons:
            btn = Button(
                20, btn_y, 200, 40,
                "添加默认飞船",
                color=NEON_COLORS['white']
            )
            btn.design_id = None
            btn.design_color = NEON_COLORS['white']
            self.add_ship_buttons.append(btn)
        
        self.add_keyframe_button = Button(
            20, 300, 200, 40,
            "添加关键帧",
            color=NEON_COLORS['pink']
        )
        
        self.delete_ship_button = Button(
            20, 360, 200, 40,
            "删除选中飞船",
            color=NEON_COLORS['orange']
        )
    
    def _get_default_design(self) -> ShipDesign:
        core_preset = MODULE_PRESETS['core'][0]
        engine_preset = MODULE_PRESETS['engines'][0]
        wing_preset = MODULE_PRESETS['wings'][0]
        
        modules = [
            Module(
                id='core', name=core_preset['name'], module_type='core',
                relative_x=0, relative_y=0,
                width=core_preset['width'], height=core_preset['height'],
                mass=core_preset['mass'], density=core_preset['density'],
                color=core_preset['color'], properties=core_preset['properties']
            ),
            Module(
                id='engine', name=engine_preset['name'], module_type='engine',
                relative_x=0, relative_y=50,
                width=engine_preset['width'], height=engine_preset['height'],
                mass=engine_preset['mass'], density=engine_preset['density'],
                color=engine_preset['color'], properties=engine_preset['properties']
            )
        ]
        
        return ShipDesign(
            id='default_ship',
            name='默认飞船',
            modules=modules,
            total_mass=100,
            center_of_mass=(0, 0),
            moment_of_inertia=1000
        )
    
    def _show_message(self, text: str):
        self.message = text
        self.message_timer = 120
    
    def _add_ship(self, design_id: Optional[str], color: Tuple[int, int, int]):
        ship_id = f"ship_{len(self.current_script.ships) + 1}"
        
        if design_id:
            design = DataManager.load_ship_design(design_id)
            if not design:
                design = self._get_default_design()
        else:
            design = self._get_default_design()
        
        center_x = self.edit_area_rect.centerx
        center_y = self.edit_area_rect.centery
        
        formation_ship = FormationShip(
            ship_id=ship_id,
            ship_design_id=design.id,
            keyframes=[
                Keyframe(
                    time=0.0,
                    position=(center_x, center_y),
                    angle=0.0,
                    interpolation='linear'
                )
            ]
        )
        
        formation_ship.design = design
        formation_ship.color = color
        formation_ship.current_position = (center_x, center_y)
        formation_ship.current_angle = 0.0
        
        self.current_script.ships.append(formation_ship)
        self.current_script.total_duration = max(
            self.current_script.total_duration,
            max(kf.time for ship in self.current_script.ships for kf in ship.keyframes) if self.current_script.ships else 0
        )
        
        self._show_message(f"已添加飞船: {ship_id}")
    
    def _add_keyframe_to_selected(self):
        if self.selected_ship_idx is None:
            self._show_message("请先选择一艘飞船")
            return
        
        ship = self.current_script.ships[self.selected_ship_idx]
        
        new_time = self.script_time
        if ship.keyframes:
            existing = [kf for kf in ship.keyframes if abs(kf.time - new_time) < 0.1]
            if existing:
                self._show_message("该时间点已有关键帧")
                return
        
        keyframe = Keyframe(
            time=new_time,
            position=ship.current_position,
            angle=ship.current_angle,
            interpolation='linear'
        )
        
        ship.keyframes.append(keyframe)
        ship.keyframes.sort(key=lambda kf: kf.time)
        
        self.current_script.total_duration = max(
            self.current_script.total_duration,
            max(kf.time for s in self.current_script.ships for kf in s.keyframes) if self.current_script.ships else 0
        )
        
        self._show_message(f"已添加关键帧 (时间: {new_time:.1f}s)")
    
    def _delete_selected_ship(self):
        if self.selected_ship_idx is not None:
            del self.current_script.ships[self.selected_ship_idx]
            self.selected_ship_idx = None
            self._show_message("已删除选中飞船")
    
    def _save_script(self):
        self.current_script.name = self.script_name_input.text or "未命名编队"
        
        for ship in self.current_script.ships:
            if hasattr(ship, 'design'):
                delattr(ship, 'design')
            if hasattr(ship, 'color'):
                delattr(ship, 'color')
            if hasattr(ship, 'current_position'):
                delattr(ship, 'current_position')
            if hasattr(ship, 'current_angle'):
                delattr(ship, 'current_angle')
        
        DataManager.save_formation_script(self.current_script)
        self._show_message(f"已保存: {self.current_script.name}")
    
    def _load_script(self):
        scripts = DataManager.list_formation_scripts()
        if scripts:
            script_id = scripts[0]
            loaded = DataManager.load_formation_script(script_id)
            if loaded:
                self.current_script = loaded
                self.script_name_input.text = loaded.name
                
                for i, ship in enumerate(self.current_script.ships):
                    design = DataManager.load_ship_design(ship.ship_design_id)
                    if not design:
                        design = self._get_default_design()
                    ship.design = design
                    ship.color = self.design_colors[i % len(self.design_colors)]
                    
                    if ship.keyframes:
                        ship.current_position = ship.keyframes[0].position
                        ship.current_angle = ship.keyframes[0].angle
                    else:
                        ship.current_position = (self.edit_area_rect.centerx, self.edit_area_rect.centery)
                        ship.current_angle = 0.0
                
                self._show_message(f"已加载: {loaded.name}")
        else:
            self._show_message("没有找到保存的编队")
    
    def _get_ship_screen_rect(self, ship: FormationShip) -> pygame.Rect:
        x, y = ship.current_position
        return pygame.Rect(x - 25, y - 25, 50, 50)
    
    def _hit_test_ship(self, screen_pos: Tuple[int, int]) -> Optional[int]:
        for i, ship in enumerate(self.current_script.ships):
            rect = self._get_ship_screen_rect(ship)
            if rect.collidepoint(screen_pos):
                return i
        return None
    
    def _interpolate_keyframes(self, ship: FormationShip, time: float) -> Tuple[Tuple[float, float], float]:
        keyframes = ship.keyframes
        if not keyframes:
            return ((self.edit_area_rect.centerx, self.edit_area_rect.centery), 0.0)
        
        if time <= keyframes[0].time:
            return keyframes[0].position, keyframes[0].angle
        
        if time >= keyframes[-1].time:
            return keyframes[-1].position, keyframes[-1].angle
        
        for i in range(len(keyframes) - 1):
            kf1 = keyframes[i]
            kf2 = keyframes[i + 1]
            
            if kf1.time <= time <= kf2.time:
                t = (time - kf1.time) / (kf2.time - kf1.time) if kf2.time > kf1.time else 0
                
                if kf1.interpolation == 'linear':
                    pos = (
                        kf1.position[0] + (kf2.position[0] - kf1.position[0]) * t,
                        kf1.position[1] + (kf2.position[1] - kf1.position[1]) * t
                    )
                    angle = kf1.angle + (kf2.angle - kf1.angle) * t
                else:
                    smooth_t = t * t * (3 - 2 * t)
                    pos = (
                        kf1.position[0] + (kf2.position[0] - kf1.position[0]) * smooth_t,
                        kf1.position[1] + (kf2.position[1] - kf1.position[1]) * smooth_t
                    )
                    angle = kf1.angle + (kf2.angle - kf1.angle) * smooth_t
                
                return pos, angle
        
        return keyframes[-1].position, keyframes[-1].angle
    
    def handle_event(self, event: pygame.event.Event) -> bool:
        if event.type == pygame.QUIT:
            self.running = False
            return True
        
        if self.back_button.handle_event(event):
            self.next_state = GameState.MENU
            return True
        
        if self.save_button.handle_event(event):
            self._save_script()
            return True
        
        if self.load_button.handle_event(event):
            self._load_script()
            return True
        
        if self.play_button.handle_event(event):
            self.is_playing = True
            return True
        
        if self.pause_button.handle_event(event):
            self.is_playing = False
            return True
        
        if self.reset_button.handle_event(event):
            self.is_playing = False
            self.script_time = 0.0
            for ship in self.current_script.ships:
                if ship.keyframes:
                    ship.current_position = ship.keyframes[0].position
                    ship.current_angle = ship.keyframes[0].angle
            return True
        
        for btn in self.add_ship_buttons:
            if btn.handle_event(event):
                self._add_ship(btn.design_id, btn.design_color)
                return True
        
        if self.add_keyframe_button.handle_event(event):
            self._add_keyframe_to_selected()
            return True
        
        if self.delete_ship_button.handle_event(event):
            self._delete_selected_ship()
            return True
        
        self.script_name_input.handle_event(event)
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                hit_idx = self._hit_test_ship(event.pos)
                if hit_idx is not None:
                    self.selected_ship_idx = hit_idx
                    self.dragging_ship = hit_idx
                    ship = self.current_script.ships[hit_idx]
                    self.drag_offset = (
                        event.pos[0] - ship.current_position[0],
                        event.pos[1] - ship.current_position[1]
                    )
                elif self.edit_area_rect.collidepoint(event.pos):
                    self.selected_ship_idx = None
        
        elif event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1:
                self.dragging_ship = None
        
        elif event.type == pygame.MOUSEMOTION:
            if self.dragging_ship is not None and not self.is_playing:
                new_pos = (
                    event.pos[0] - self.drag_offset[0],
                    event.pos[1] - self.drag_offset[1]
                )
                ship = self.current_script.ships[self.dragging_ship]
                ship.current_position = new_pos
        
        elif event.type == pygame.MOUSEWHEEL:
            if not self.is_playing:
                self.script_time = max(0, self.script_time + event.y * 0.5)
                if self.current_script.ships:
                    max_time = max(kf.time for s in self.current_script.ships for kf in s.keyframes)
                    self.script_time = min(self.script_time, max_time)
                
                for ship in self.current_script.ships:
                    pos, angle = self._interpolate_keyframes(ship, self.script_time)
                    ship.current_position = pos
                    ship.current_angle = angle
        
        return False
    
    def update(self):
        self.script_name_input.update()
        
        if self.message_timer > 0:
            self.message_timer -= 1
            if self.message_timer <= 0:
                self.message = None
        
        if self.is_playing:
            self.script_time += 1.0 / 60.0 * self.playback_speed
            
            for ship in self.current_script.ships:
                pos, angle = self._interpolate_keyframes(ship, self.script_time)
                ship.current_position = pos
                ship.current_angle = angle
            
            if self.current_script.total_duration > 0 and self.script_time > self.current_script.total_duration:
                self.is_playing = False
                self.script_time = self.current_script.total_duration
    
    def _draw_ship(self, ship: FormationShip, is_selected: bool):
        x, y = ship.current_position
        angle = ship.current_angle
        
        color = ship.color if hasattr(ship, 'color') else NEON_COLORS['white']
        
        size = 20
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
        
        pygame.draw.polygon(self.screen, (*color, 40), rotated_points)
        
        for i in range(len(rotated_points)):
            start = rotated_points[i]
            end = rotated_points[(i + 1) % len(rotated_points)]
            NeonRenderer.draw_neon_line(self.screen, start, end, color, thickness=2)
        
        if is_selected:
            NeonRenderer.draw_neon_circle(self.screen, (int(x), int(y)), 30, NEON_COLORS['magenta'], thickness=2)
    
    def _draw_keyframes(self):
        for ship in self.current_script.ships:
            color = ship.color if hasattr(ship, 'color') else NEON_COLORS['white']
            
            for i, kf in enumerate(ship.keyframes):
                screen_pos = (int(kf.position[0]), int(kf.position[1]))
                
                if i == 0:
                    NeonRenderer.draw_neon_circle(self.screen, screen_pos, 8, NEON_COLORS['green'], thickness=3)
                else:
                    pygame.draw.circle(self.screen, color, screen_pos, 6)
                
                if self.is_playing and abs(kf.time - self.script_time) < 0.05:
                    NeonRenderer.draw_neon_circle(self.screen, screen_pos, 12, NEON_COLORS['yellow'], thickness=2)
            
            if len(ship.keyframes) >= 2:
                for i in range(len(ship.keyframes) - 1):
                    kf1 = ship.keyframes[i]
                    kf2 = ship.keyframes[i + 1]
                    
                    start = (int(kf1.position[0]), int(kf1.position[1]))
                    end = (int(kf2.position[0]), int(kf2.position[1]))
                    
                    pygame.draw.line(self.screen, (*color, 80), start, end, 1)
    
    def _draw_timeline(self):
        timeline_y = SCREEN_HEIGHT - 100
        timeline_x = 50
        timeline_width = SCREEN_WIDTH - 100
        timeline_height = 30
        
        pygame.draw.rect(self.screen, NEON_COLORS['menu_bg'], 
                        (timeline_x, timeline_y, timeline_width, timeline_height))
        NeonRenderer.draw_neon_rect(self.screen, 
                                    pygame.Rect(timeline_x, timeline_y, timeline_width, timeline_height),
                                    NEON_COLORS['cyan'], thickness=2)
        
        total_duration = max(self.current_script.total_duration, 10.0)
        
        for t in range(0, int(total_duration) + 1, 2):
            tick_x = timeline_x + (t / total_duration) * timeline_width
            pygame.draw.line(self.screen, NEON_COLORS['white'], 
                           (tick_x, timeline_y), (tick_x, timeline_y - 10), 1)
            
            time_surface = self.font_small.render(f"{t}s", True, NEON_COLORS['white'])
            self.screen.blit(time_surface, (tick_x - 10, timeline_y - 25))
        
        playhead_x = timeline_x + (self.script_time / total_duration) * timeline_width
        pygame.draw.line(self.screen, NEON_COLORS['yellow'],
                        (playhead_x, timeline_y - 20), (playhead_x, timeline_y + timeline_height), 3)
        
        NeonRenderer.draw_neon_text(self.screen, f"时间: {self.script_time:.1f}s / {total_duration:.1f}s",
                                    self.font_small, (timeline_x + timeline_width // 2, timeline_y - 35),
                                    NEON_COLORS['white'])
    
    def _draw_info_panel(self):
        info_x = SCREEN_WIDTH - 220
        info_y = 100
        
        NeonRenderer.draw_neon_text(self.screen, "编队信息", self.font_medium,
                                    (info_x + 100, info_y), NEON_COLORS['cyan'])
        
        info_y += 40
        
        NeonRenderer.draw_neon_text(self.screen, f"飞船数量: {len(self.current_script.ships)}",
                                    self.font_small, (info_x, info_y), NEON_COLORS['white'], center=False)
        info_y += 25
        
        NeonRenderer.draw_neon_text(self.screen, f"总时长: {self.current_script.total_duration:.1f}s",
                                    self.font_small, (info_x, info_y), NEON_COLORS['white'], center=False)
        info_y += 40
        
        if self.selected_ship_idx is not None:
            ship = self.current_script.ships[self.selected_ship_idx]
            NeonRenderer.draw_neon_text(self.screen, f"选中: {ship.ship_id}",
                                        self.font_small, (info_x, info_y), ship.color, center=False)
            info_y += 25
            NeonRenderer.draw_neon_text(self.screen, f"关键帧: {len(ship.keyframes)}",
                                        self.font_small, (info_x, info_y), NEON_COLORS['white'], center=False)
        
        info_y += 60
        NeonRenderer.draw_neon_text(self.screen, "操作说明", self.font_medium,
                                    (info_x + 100, info_y), NEON_COLORS['magenta'])
        info_y += 40
        
        hints = [
            "点击飞船选中",
            "拖动飞船移动",
            "滚轮调整时间",
            "添加关键帧记录"
        ]
        for hint in hints:
            NeonRenderer.draw_neon_text(self.screen, hint, self.font_small,
                                        (info_x, info_y), NEON_COLORS['white'], center=False)
            info_y += 20
    
    def draw(self):
        self.screen.fill(NEON_COLORS['dark_bg'])
        
        pygame.draw.rect(self.screen, NEON_COLORS['menu_bg'], self.edit_area_rect)
        NeonRenderer.draw_neon_rect(self.screen, self.edit_area_rect, NEON_COLORS['cyan'], thickness=2)
        
        grid_color = (*NEON_COLORS['cyan'], 20)
        for x in range(self.edit_area_rect.x, self.edit_area_rect.x + self.edit_area_rect.width, 50):
            pygame.draw.line(self.screen, grid_color, (x, self.edit_area_rect.y), 
                           (x, self.edit_area_rect.y + self.edit_area_rect.height))
        for y in range(self.edit_area_rect.y, self.edit_area_rect.y + self.edit_area_rect.height, 50):
            pygame.draw.line(self.screen, grid_color, (self.edit_area_rect.x, y), 
                           (self.edit_area_rect.x + self.edit_area_rect.width, y))
        
        self._draw_keyframes()
        
        for i, ship in enumerate(self.current_script.ships):
            self._draw_ship(ship, i == self.selected_ship_idx)
        
        self.back_button.draw(self.screen, self.font_small)
        self.save_button.draw(self.screen, self.font_small)
        self.load_button.draw(self.screen, self.font_small)
        
        for btn in self.add_ship_buttons:
            btn.draw(self.screen, self.font_small)
        
        self.add_keyframe_button.draw(self.screen, self.font_small)
        self.delete_ship_button.draw(self.screen, self.font_small)
        
        self.script_name_input.draw(self.screen, self.font_small)
        
        self.play_button.draw(self.screen, self.font_small)
        self.pause_button.draw(self.screen, self.font_small)
        self.reset_button.draw(self.screen, self.font_small)
        
        self._draw_timeline()
        self._draw_info_panel()
        
        if self.message and self.message_timer > 0:
            msg_surface = self.font_medium.render(self.message, True, NEON_COLORS['green'])
            msg_rect = msg_surface.get_rect(center=(SCREEN_WIDTH // 2, 80))
            pygame.draw.rect(self.screen, (*NEON_COLORS['dark_bg'], 200), msg_rect.inflate(20, 10))
            self.screen.blit(msg_surface, msg_rect)
        
        NeonRenderer.draw_neon_text(self.screen, "编队编辑器", self.font_large,
                                    (SCREEN_WIDTH // 2, 40), NEON_COLORS['cyan'])
    
    def run(self) -> Optional[GameState]:
        self.running = True
        self.next_state = None
        
        while self.running:
            for event in pygame.event.get():
                self.handle_event(event)
            
            self.update()
            self.draw()
            pygame.display.flip()
            self.clock.tick(60)
        
        return self.next_state
