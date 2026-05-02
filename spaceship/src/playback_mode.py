import pygame
import pymunk
import random
import math
import os
from typing import Dict, List, Tuple, Optional, Any
import numpy as np

from .config import SCREEN_WIDTH, SCREEN_HEIGHT, NEON_COLORS, MODULE_PRESETS
from .core import (
    FormationScript, FormationShip, Keyframe,
    ShipDesign, DataManager, NeonRenderer, Button, InputBox, GameState, Module,
    PhysicsCalculator
)


class PlaybackMode:
    def __init__(self, screen: pygame.Surface, clock: pygame.time.Clock):
        self.screen = screen
        self.clock = clock
        self.running = True
        self.next_state: Optional[GameState] = None
        
        self.font_large = pygame.font.Font(None, 48)
        self.font_medium = pygame.font.Font(None, 36)
        self.font_small = pygame.font.Font(None, 24)
        
        self.script: Optional[FormationScript] = None
        
        self.script_time = 0.0
        self.is_playing = False
        self.playback_speed = 1.0
        self.is_looping = False
        
        self.camera_x = 0.0
        self.camera_y = 0.0
        self.camera_target_x = 0.0
        self.camera_target_y = 0.0
        self.camera_smooth = 0.03
        self.camera_mode = 'follow'
        
        self.follow_ship_idx = 0
        
        self.available_scripts = DataManager.list_formation_scripts()
        self.design_colors = [
            NEON_COLORS['cyan'],
            NEON_COLORS['magenta'],
            NEON_COLORS['yellow'],
            NEON_COLORS['green'],
            NEON_COLORS['pink'],
            NEON_COLORS['orange']
        ]
        
        self._init_buttons()
        
        self._load_default_script()
        
        self.particles = []
        self.stars = self._generate_stars()
        
        self.audio_playing = False
        self.audio_track = None
    
    def _generate_stars(self) -> List[Dict]:
        stars = []
        random.seed(42)
        for _ in range(200):
            stars.append({
                'x': random.uniform(-2000, 4000),
                'y': random.uniform(-2000, 4000),
                'size': random.uniform(1, 3),
                'brightness': random.uniform(100, 255),
                'parallax': random.uniform(0.1, 0.5)
            })
        random.seed()
        return stars
    
    def _init_buttons(self):
        self.back_button = Button(
            SCREEN_WIDTH - 120, 20, 100, 40,
            "返回",
            color=NEON_COLORS['magenta']
        )
        
        self.play_button = Button(
            SCREEN_WIDTH // 2 - 160, SCREEN_HEIGHT - 60, 100, 40,
            "播放",
            color=NEON_COLORS['green']
        )
        
        self.pause_button = Button(
            SCREEN_WIDTH // 2 - 55, SCREEN_HEIGHT - 60, 100, 40,
            "暂停",
            color=NEON_COLORS['yellow']
        )
        
        self.reset_button = Button(
            SCREEN_WIDTH // 2 + 50, SCREEN_HEIGHT - 60, 100, 40,
            "重置",
            color=NEON_COLORS['orange']
        )
        
        self.loop_button = Button(
            SCREEN_WIDTH // 2 + 155, SCREEN_HEIGHT - 60, 100, 40,
            "循环: 关",
            color=NEON_COLORS['cyan']
        )
        
        self.camera_button = Button(
            SCREEN_WIDTH - 240, 20, 120, 40,
            "跟随模式",
            color=NEON_COLORS['pink']
        )
        
        btn_y = 100
        self.load_script_buttons: List[Button] = []
        
        if self.available_scripts:
            for i, script_id in enumerate(self.available_scripts[:5]):
                color = self.design_colors[i % len(self.design_colors)]
                btn = Button(
                    20, btn_y, 200, 40,
                    f"加载: {script_id[:12]}",
                    color=color
                )
                btn.script_id = script_id
                self.load_script_buttons.append(btn)
                btn_y += 50
        
        if not self.load_script_buttons:
            btn = Button(
                20, btn_y, 200, 40,
                "无可用剧本",
                color=NEON_COLORS['white']
            )
            btn.script_id = None
            self.load_script_buttons.append(btn)
    
    def _load_default_script(self):
        if self.available_scripts:
            script_id = self.available_scripts[0]
            self._load_script(script_id)
        else:
            self._create_demo_script()
    
    def _create_demo_script(self):
        ships = []
        
        ship1 = FormationShip(
            ship_id="ship_1",
            ship_design_id="demo",
            keyframes=[
                Keyframe(time=0.0, position=(200, SCREEN_HEIGHT // 2), angle=0.0),
                Keyframe(time=3.0, position=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 100), angle=0.5),
                Keyframe(time=6.0, position=(SCREEN_WIDTH - 200, SCREEN_HEIGHT // 2), angle=0.0),
                Keyframe(time=9.0, position=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 100), angle=-0.5),
                Keyframe(time=12.0, position=(200, SCREEN_HEIGHT // 2), angle=0.0),
            ]
        )
        ship1.design = self._get_demo_design()
        ship1.color = NEON_COLORS['cyan']
        ships.append(ship1)
        
        ship2 = FormationShip(
            ship_id="ship_2",
            ship_design_id="demo",
            keyframes=[
                Keyframe(time=0.0, position=(200, SCREEN_HEIGHT // 2 - 80), angle=0.0),
                Keyframe(time=3.0, position=(SCREEN_WIDTH // 2 - 80, SCREEN_HEIGHT // 2), angle=0.3),
                Keyframe(time=6.0, position=(SCREEN_WIDTH - 200, SCREEN_HEIGHT // 2 - 80), angle=0.0),
                Keyframe(time=9.0, position=(SCREEN_WIDTH // 2 + 80, SCREEN_HEIGHT // 2), angle=-0.3),
                Keyframe(time=12.0, position=(200, SCREEN_HEIGHT // 2 - 80), angle=0.0),
            ]
        )
        ship2.design = self._get_demo_design()
        ship2.color = NEON_COLORS['magenta']
        ships.append(ship2)
        
        ship3 = FormationShip(
            ship_id="ship_3",
            ship_design_id="demo",
            keyframes=[
                Keyframe(time=0.0, position=(200, SCREEN_HEIGHT // 2 + 80), angle=0.0),
                Keyframe(time=3.0, position=(SCREEN_WIDTH // 2 + 80, SCREEN_HEIGHT // 2), angle=-0.3),
                Keyframe(time=6.0, position=(SCREEN_WIDTH - 200, SCREEN_HEIGHT // 2 + 80), angle=0.0),
                Keyframe(time=9.0, position=(SCREEN_WIDTH // 2 - 80, SCREEN_HEIGHT // 2), angle=0.3),
                Keyframe(time=12.0, position=(200, SCREEN_HEIGHT // 2 + 80), angle=0.0),
            ]
        )
        ship3.design = self._get_demo_design()
        ship3.color = NEON_COLORS['yellow']
        ships.append(ship3)
        
        self.script = FormationScript(
            id="demo_script",
            name="演示编队",
            ships=ships,
            total_duration=12.0,
            audio_track=None
        )
        
        for ship in self.script.ships:
            ship.current_position = ship.keyframes[0].position
            ship.current_angle = ship.keyframes[0].angle
    
    def _get_demo_design(self) -> ShipDesign:
        core_preset = MODULE_PRESETS['core'][0]
        engine_preset = MODULE_PRESETS['engines'][0]
        
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
            id='demo',
            name='演示飞船',
            modules=modules,
            total_mass=100,
            center_of_mass=(0, 0),
            moment_of_inertia=1000
        )
    
    def _load_script(self, script_id: str):
        loaded = DataManager.load_formation_script(script_id)
        if loaded:
            self.script = loaded
            
            for i, ship in enumerate(self.script.ships):
                design = DataManager.load_ship_design(ship.ship_design_id)
                if not design:
                    design = self._get_demo_design()
                ship.design = design
                ship.color = self.design_colors[i % len(self.design_colors)]
                
                if ship.keyframes:
                    ship.current_position = ship.keyframes[0].position
                    ship.current_angle = ship.keyframes[0].angle
                else:
                    ship.current_position = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
                    ship.current_angle = 0.0
            
            self.script_time = 0.0
    
    def _world_to_screen(self, world_pos: Tuple[float, float]) -> Tuple[int, int]:
        screen_x = int(world_pos[0] - self.camera_x + SCREEN_WIDTH // 2)
        screen_y = int(world_pos[1] - self.camera_y + SCREEN_HEIGHT // 2)
        return screen_x, screen_y
    
    def _interpolate_keyframes(self, ship: FormationShip, time: float) -> Tuple[Tuple[float, float], float]:
        keyframes = ship.keyframes
        if not keyframes:
            return ((SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2), 0.0)
        
        if time <= keyframes[0].time:
            return keyframes[0].position, keyframes[0].angle
        
        if time >= keyframes[-1].time:
            if self.is_looping:
                wrapped_time = time % self.script.total_duration
                return self._interpolate_keyframes(ship, wrapped_time)
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
        
        if self.play_button.handle_event(event):
            self.is_playing = True
            return True
        
        if self.pause_button.handle_event(event):
            self.is_playing = False
            return True
        
        if self.reset_button.handle_event(event):
            self.is_playing = False
            self.script_time = 0.0
            if self.script:
                for ship in self.script.ships:
                    if ship.keyframes:
                        ship.current_position = ship.keyframes[0].position
                        ship.current_angle = ship.keyframes[0].angle
            return True
        
        if self.loop_button.handle_event(event):
            self.is_looping = not self.is_looping
            self.loop_button.text = f"循环: {'开' if self.is_looping else '关'}"
            return True
        
        if self.camera_button.handle_event(event):
            if self.camera_mode == 'follow':
                self.camera_mode = 'free'
                self.camera_button.text = "自由模式"
            else:
                self.camera_mode = 'follow'
                self.camera_button.text = "跟随模式"
            return True
        
        for btn in self.load_script_buttons:
            if btn.handle_event(event) and btn.script_id:
                self._load_script(btn.script_id)
                return True
        
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self.next_state = GameState.MENU
                return True
            elif event.key == pygame.K_SPACE:
                self.is_playing = not self.is_playing
                return True
            elif event.key == pygame.K_LEFT:
                self.script_time = max(0, self.script_time - 0.5)
                self.is_playing = False
            elif event.key == pygame.K_RIGHT:
                self.script_time += 0.5
                self.is_playing = False
            elif event.key == pygame.K_TAB:
                if self.script and self.script.ships:
                    self.follow_ship_idx = (self.follow_ship_idx + 1) % len(self.script.ships)
        
        return False
    
    def _update_camera(self):
        if self.camera_mode == 'follow' and self.script and self.script.ships:
            if 0 <= self.follow_ship_idx < len(self.script.ships):
                ship = self.script.ships[self.follow_ship_idx]
                self.camera_target_x = ship.current_position[0] - SCREEN_WIDTH // 2
                self.camera_target_y = ship.current_position[1] - SCREEN_HEIGHT // 2
        
        self.camera_x += (self.camera_target_x - self.camera_x) * self.camera_smooth
        self.camera_y += (self.camera_target_y - self.camera_y) * self.camera_smooth
    
    def _add_particles(self):
        if self.is_playing and self.script:
            for ship in self.script.ships:
                if random.random() < 0.3:
                    angle = ship.current_angle + math.pi
                    offset_dir = random.uniform(-0.3, 0.3)
                    particle_angle = angle + offset_dir
                    
                    speed = random.uniform(50, 150)
                    
                    self.particles.append({
                        'x': ship.current_position[0],
                        'y': ship.current_position[1],
                        'vx': math.cos(particle_angle) * speed,
                        'vy': math.sin(particle_angle) * speed,
                        'life': 1.0,
                        'color': ship.color,
                        'size': random.uniform(2, 5)
                    })
    
    def _update_particles(self):
        dt = 1.0 / 60.0
        for particle in self.particles[:]:
            particle['x'] += particle['vx'] * dt
            particle['y'] += particle['vy'] * dt
            particle['life'] -= dt * 1.5
            
            if particle['life'] <= 0:
                self.particles.remove(particle)
    
    def update(self):
        if self.is_playing and self.script:
            self.script_time += 1.0 / 60.0 * self.playback_speed
            
            for ship in self.script.ships:
                pos, angle = self._interpolate_keyframes(ship, self.script_time)
                ship.current_position = pos
                ship.current_angle = angle
            
            if not self.is_looping and self.script_time >= self.script.total_duration:
                self.is_playing = False
                self.script_time = self.script.total_duration
            
            self._add_particles()
        
        self._update_particles()
        self._update_camera()
    
    def _draw_stars(self):
        for star in self.stars:
            parallax = star['parallax']
            screen_x = int(star['x'] - self.camera_x * parallax + SCREEN_WIDTH // 2)
            screen_y = int(star['y'] - self.camera_y * parallax + SCREEN_HEIGHT // 2)
            
            if 0 <= screen_x <= SCREEN_WIDTH and 0 <= screen_y <= SCREEN_HEIGHT:
                brightness = int(star['brightness'])
                size = int(star['size'])
                pygame.draw.circle(self.screen, (brightness, brightness, brightness), 
                                  (screen_x, screen_y), size)
    
    def _draw_ship(self, ship: FormationShip):
        x, y = ship.current_position
        angle = ship.current_angle
        
        color = ship.color if hasattr(ship, 'color') else NEON_COLORS['white']
        
        size = 25
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
            world_pos = (x + rx, y + ry)
            screen_pos = self._world_to_screen(world_pos)
            rotated_points.append(screen_pos)
        
        pygame.draw.polygon(self.screen, (*color, 50), rotated_points)
        
        for i in range(len(rotated_points)):
            start = rotated_points[i]
            end = rotated_points[(i + 1) % len(rotated_points)]
            NeonRenderer.draw_neon_line(self.screen, start, end, color, thickness=3)
        
        if self.is_playing:
            engine_angle = angle + math.pi
            flame_length = random.uniform(15, 30)
            
            base_x = x + math.cos(engine_angle) * size
            base_y = y + math.sin(engine_angle) * size
            tip_x = base_x + math.cos(engine_angle) * flame_length
            tip_y = base_y + math.sin(engine_angle) * flame_length
            
            base_screen = self._world_to_screen((base_x, base_y))
            tip_screen = self._world_to_screen((tip_x, tip_y))
            
            flame_color = NEON_COLORS['orange']
            NeonRenderer.draw_neon_line(self.screen, base_screen, tip_screen, flame_color, thickness=4)
    
    def _draw_particles(self):
        for particle in self.particles:
            screen_pos = self._world_to_screen((particle['x'], particle['y']))
            alpha = int(particle['life'] * 255)
            size = int(particle['size'] * particle['life'])
            
            color = particle['color']
            pygame.draw.circle(self.screen, (*color, alpha), screen_pos, size)
    
    def _draw_keyframe_paths(self):
        if not self.script:
            return
        
        for ship in self.script.ships:
            color = ship.color if hasattr(ship, 'color') else NEON_COLORS['white']
            
            if len(ship.keyframes) >= 2:
                for i in range(len(ship.keyframes) - 1):
                    kf1 = ship.keyframes[i]
                    kf2 = ship.keyframes[i + 1]
                    
                    start = self._world_to_screen(kf1.position)
                    end = self._world_to_screen(kf2.position)
                    
                    pygame.draw.line(self.screen, (*color, 60), start, end, 2)
            
            for i, kf in enumerate(ship.keyframes):
                screen_pos = self._world_to_screen(kf.position)
                if i == 0:
                    NeonRenderer.draw_neon_circle(self.screen, screen_pos, 8, NEON_COLORS['green'], thickness=3)
                elif i == len(ship.keyframes) - 1:
                    NeonRenderer.draw_neon_circle(self.screen, screen_pos, 8, NEON_COLORS['red'] if 'red' in NEON_COLORS else NEON_COLORS['orange'], thickness=3)
                else:
                    pygame.draw.circle(self.screen, color, screen_pos, 5)
    
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
        
        total_duration = max(self.script.total_duration if self.script else 10.0, 1.0)
        
        for t in range(0, int(total_duration) + 1, 2):
            tick_x = timeline_x + (t / total_duration) * timeline_width
            pygame.draw.line(self.screen, NEON_COLORS['white'], 
                           (tick_x, timeline_y), (tick_x, timeline_y - 10), 1)
            
            time_surface = self.font_small.render(f"{t}s", True, NEON_COLORS['white'])
            self.screen.blit(time_surface, (tick_x - 10, timeline_y - 25))
        
        playhead_x = timeline_x + (self.script_time / total_duration) * timeline_width
        pygame.draw.line(self.screen, NEON_COLORS['yellow'],
                        (playhead_x, timeline_y - 20), (playhead_x, timeline_y + timeline_height), 4)
        
        status_text = f"{'播放中' if self.is_playing else '已暂停'} | 时间: {self.script_time:.1f}s / {total_duration:.1f}s"
        NeonRenderer.draw_neon_text(self.screen, status_text,
                                    self.font_small, (timeline_x + timeline_width // 2, timeline_y - 35),
                                    NEON_COLORS['white'])
    
    def _draw_info_panel(self):
        info_x = SCREEN_WIDTH - 220
        info_y = 100
        
        NeonRenderer.draw_neon_text(self.screen, "表演回放", self.font_medium,
                                    (info_x + 100, info_y), NEON_COLORS['cyan'])
        
        info_y += 40
        
        if self.script:
            NeonRenderer.draw_neon_text(self.screen, f"剧本: {self.script.name}",
                                        self.font_small, (info_x, info_y), NEON_COLORS['white'], center=False)
            info_y += 25
            NeonRenderer.draw_neon_text(self.screen, f"飞船数: {len(self.script.ships)}",
                                        self.font_small, (info_x, info_y), NEON_COLORS['white'], center=False)
            info_y += 25
            NeonRenderer.draw_neon_text(self.screen, f"时长: {self.script.total_duration:.1f}s",
                                        self.font_small, (info_x, info_y), NEON_COLORS['white'], center=False)
            info_y += 40
            
            if self.camera_mode == 'follow' and self.script.ships:
                ship = self.script.ships[self.follow_ship_idx]
                NeonRenderer.draw_neon_text(self.screen, f"跟随: {ship.ship_id}",
                                            self.font_small, (info_x, info_y), ship.color, center=False)
        
        info_y += 60
        NeonRenderer.draw_neon_text(self.screen, "控制", self.font_medium,
                                    (info_x + 100, info_y), NEON_COLORS['magenta'])
        info_y += 40
        
        controls = [
            "空格 - 播放/暂停",
            "←→ - 前后移动",
            "Tab - 切换跟随",
            "ESC - 返回菜单"
        ]
        for ctrl in controls:
            NeonRenderer.draw_neon_text(self.screen, ctrl, self.font_small,
                                        (info_x, info_y), NEON_COLORS['white'], center=False)
            info_y += 20
    
    def draw(self):
        self.screen.fill(NEON_COLORS['dark_bg'])
        
        self._draw_stars()
        self._draw_keyframe_paths()
        self._draw_particles()
        
        if self.script:
            for ship in self.script.ships:
                self._draw_ship(ship)
        
        self.back_button.draw(self.screen, self.font_small)
        self.camera_button.draw(self.screen, self.font_small)
        
        for btn in self.load_script_buttons:
            btn.draw(self.screen, self.font_small)
        
        self.play_button.draw(self.screen, self.font_small)
        self.pause_button.draw(self.screen, self.font_small)
        self.reset_button.draw(self.screen, self.font_small)
        self.loop_button.draw(self.screen, self.font_small)
        
        self._draw_timeline()
        self._draw_info_panel()
        
        title = "表演回放"
        if self.is_playing:
            title += " ▶"
        NeonRenderer.draw_neon_text(self.screen, title, self.font_large,
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
