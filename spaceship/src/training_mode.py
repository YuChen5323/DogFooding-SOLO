import pygame
import pymunk
import pymunk.pygame_util
import random
import math
from typing import Dict, List, Tuple, Optional, Any
import numpy as np

from .config import SCREEN_WIDTH, SCREEN_HEIGHT, NEON_COLORS, MODULE_PRESETS
from .core import (
    ShipDesign, PhysicsCalculator, DataManager,
    NeonRenderer, Button, GameState, Module
)


class TrainingMode:
    def __init__(self, screen: pygame.Surface, clock: pygame.time.Clock):
        self.screen = screen
        self.clock = clock
        self.running = True
        self.next_state: Optional[GameState] = None
        
        self.font_large = pygame.font.Font(None, 48)
        self.font_medium = pygame.font.Font(None, 36)
        self.font_small = pygame.font.Font(None, 24)
        
        self.space = pymunk.Space()
        self.space.gravity = (0, 0)
        
        self.camera_x = 0.0
        self.camera_y = 0.0
        self.camera_smooth = 0.05
        
        self.player_body: Optional[pymunk.Body] = None
        self.player_shapes: List[pymunk.Shape] = []
        self.player_design: Optional[ShipDesign] = None
        
        self.asteroids: List[Tuple[pymunk.Body, pymunk.Shape]] = []
        
        self.thrust_active = False
        self.rotate_left = False
        self.rotate_right = False
        
        self.thrust_power = 0.0
        self.max_thrust = 2000.0
        self.rotation_torque = 5000.0
        
        self._init_buttons()
        self._load_ship_design()
        self._spawn_asteroids()
        
        handler = self.space.add_collision_handler(1, 2)
        handler.begin = self._on_collision
    
    def _init_buttons(self):
        self.back_button = Button(
            SCREEN_WIDTH - 120, 20, 100, 40,
            "返回",
            color=NEON_COLORS['magenta']
        )
        
        self.reset_button = Button(
            SCREEN_WIDTH - 240, 20, 100, 40,
            "重置",
            color=NEON_COLORS['orange']
        )
    
    def _load_ship_design(self):
        designs = DataManager.list_ship_designs()
        
        if designs:
            design_id = designs[0]
            self.player_design = DataManager.load_ship_design(design_id)
        
        if not self.player_design or not self.player_design.modules:
            self._create_default_ship()
        
        if self.player_body:
            for shape in self.player_shapes:
                self.space.remove(shape)
            self.space.remove(self.player_body)
        
        start_pos = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        self.player_body, self.player_shapes = PhysicsCalculator.create_pymunk_body(
            self.player_design, start_pos
        )
        
        self.space.add(self.player_body)
        for shape in self.player_shapes:
            self.space.add(shape)
    
    def _create_default_ship(self):
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
            ),
            Module(
                id='wing_l', name=wing_preset['name'], module_type='wing',
                relative_x=-50, relative_y=0,
                width=wing_preset['width'], height=wing_preset['height'],
                mass=wing_preset['mass'], density=wing_preset['density'],
                color=wing_preset['color'], properties=wing_preset['properties']
            ),
            Module(
                id='wing_r', name=wing_preset['name'], module_type='wing',
                relative_x=50, relative_y=0,
                width=wing_preset['width'], height=wing_preset['height'],
                mass=wing_preset['mass'], density=wing_preset['density'],
                color=wing_preset['color'], properties=wing_preset['properties']
            )
        ]
        
        mass, com, moi = PhysicsCalculator.calculate_ship_properties(modules)
        
        self.player_design = ShipDesign(
            id='default_ship',
            name='默认飞船',
            modules=modules,
            total_mass=mass,
            center_of_mass=com,
            moment_of_inertia=moi
        )
    
    def _spawn_asteroids(self):
        num_asteroids = 30
        
        for _ in range(num_asteroids):
            angle = random.uniform(0, math.pi * 2)
            distance = random.uniform(300, 1500)
            x = SCREEN_WIDTH // 2 + math.cos(angle) * distance
            y = SCREEN_HEIGHT // 2 + math.sin(angle) * distance
            
            radius = random.uniform(15, 50)
            mass = radius * radius * 2
            
            body, shape = PhysicsCalculator.create_asteroid((x, y), radius, mass)
            
            body.velocity = (
                random.uniform(-50, 50),
                random.uniform(-50, 50)
            )
            body.angular_velocity = random.uniform(-0.5, 0.5)
            
            self.space.add(body, shape)
            self.asteroids.append((body, shape))
    
    def _on_collision(self, arbiter: pymunk.Arbiter, space: pymunk.Space, data: Any) -> bool:
        impulse = arbiter.total_impulse
        impulse_mag = math.sqrt(impulse[0]**2 + impulse[1]**2)
        
        if impulse_mag > 100:
            pass
        
        return True
    
    def _reset_player(self):
        if self.player_body:
            self.player_body.position = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
            self.player_body.velocity = (0, 0)
            self.player_body.angle = 0
            self.player_body.angular_velocity = 0
        
        self.camera_x = 0.0
        self.camera_y = 0.0
    
    def _world_to_screen(self, world_pos: Tuple[float, float]) -> Tuple[int, int]:
        screen_x = int(world_pos[0] - self.camera_x + SCREEN_WIDTH // 2)
        screen_y = int(world_pos[1] - self.camera_y + SCREEN_HEIGHT // 2)
        return screen_x, screen_y
    
    def _screen_to_world(self, screen_pos: Tuple[int, int]) -> Tuple[float, float]:
        world_x = screen_pos[0] + self.camera_x - SCREEN_WIDTH // 2
        world_y = screen_pos[1] + self.camera_y - SCREEN_HEIGHT // 2
        return world_x, world_y
    
    def handle_event(self, event: pygame.event.Event) -> bool:
        if event.type == pygame.QUIT:
            self.running = False
            return True
        
        if self.back_button.handle_event(event):
            self.next_state = GameState.MENU
            return True
        
        if self.reset_button.handle_event(event):
            self._reset_player()
            return True
        
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_w or event.key == pygame.K_UP:
                self.thrust_active = True
            elif event.key == pygame.K_a or event.key == pygame.K_LEFT:
                self.rotate_left = True
            elif event.key == pygame.K_d or event.key == pygame.K_RIGHT:
                self.rotate_right = True
            elif event.key == pygame.K_ESCAPE:
                self.next_state = GameState.MENU
                return True
        
        elif event.type == pygame.KEYUP:
            if event.key == pygame.K_w or event.key == pygame.K_UP:
                self.thrust_active = False
            elif event.key == pygame.K_a or event.key == pygame.K_LEFT:
                self.rotate_left = False
            elif event.key == pygame.K_d or event.key == pygame.K_RIGHT:
                self.rotate_right = False
        
        return False
    
    def update(self):
        dt = 1.0 / 60.0
        
        if self.player_body:
            if self.thrust_active:
                thrust_vec = pymunk.Vec2d(0, -self.max_thrust)
                thrust_vec = thrust_vec.rotated(self.player_body.angle)
                self.player_body.apply_force_at_world_point(thrust_vec, self.player_body.position)
                self.thrust_power = min(self.thrust_power + 0.1, 1.0)
            else:
                self.thrust_power = max(self.thrust_power - 0.05, 0.0)
            
            if self.rotate_left:
                self.player_body.apply_torque(-self.rotation_torque)
            if self.rotate_right:
                self.player_body.apply_torque(self.rotation_torque)
            
            damping = 0.999
            self.player_body.velocity = (
                self.player_body.velocity[0] * damping,
                self.player_body.velocity[1] * damping
            )
            self.player_body.angular_velocity *= damping
        
        self.space.step(dt)
        
        if self.player_body:
            target_cam_x = self.player_body.position.x - SCREEN_WIDTH // 2
            target_cam_y = self.player_body.position.y - SCREEN_HEIGHT // 2
            
            self.camera_x += (target_cam_x - self.camera_x) * self.camera_smooth
            self.camera_y += (target_cam_y - self.camera_y) * self.camera_smooth
    
    def _draw_ship(self):
        if not self.player_body or not self.player_design:
            return
        
        com_x, com_y = self.player_design.center_of_mass
        
        for module in self.player_design.modules:
            local_x = module.relative_x - com_x
            local_y = module.relative_y - com_y
            
            half_w = module.width / 2
            half_h = module.height / 2
            
            corners = [
                (local_x - half_w, local_y - half_h),
                (local_x + half_w, local_y - half_h),
                (local_x + half_w, local_y + half_h),
                (local_x - half_w, local_y + half_h)
            ]
            
            angle = self.player_body.angle
            rotated_corners = []
            for cx, cy in corners:
                rotated_x = cx * math.cos(angle) - cy * math.sin(angle)
                rotated_y = cx * math.sin(angle) + cy * math.cos(angle)
                world_x = rotated_x + self.player_body.position.x
                world_y = rotated_y + self.player_body.position.y
                screen_pos = self._world_to_screen((world_x, world_y))
                rotated_corners.append(screen_pos)
            
            pygame.draw.polygon(self.screen, (*module.color, 40), rotated_corners)
            
            for i in range(4):
                start = rotated_corners[i]
                end = rotated_corners[(i + 1) % 4]
                NeonRenderer.draw_neon_line(self.screen, start, end, module.color, thickness=2)
        
        if self.thrust_power > 0.1:
            flame_length = 30 + self.thrust_power * 40
            flame_dir = pymunk.Vec2d(0, 1).rotated(self.player_body.angle)
            
            engine_modules = [m for m in self.player_design.modules if m.module_type == 'engine']
            for module in engine_modules:
                local_x = module.relative_x - com_x
                local_y = module.relative_y - com_y + module.height / 2
                
                rotated_x = local_x * math.cos(angle) - local_y * math.sin(angle)
                rotated_y = local_x * math.sin(angle) + local_y * math.cos(angle)
                
                base_world_x = rotated_x + self.player_body.position.x
                base_world_y = rotated_y + self.player_body.position.y
                
                tip_world_x = base_world_x + flame_dir.x * flame_length
                tip_world_y = base_world_y + flame_dir.y * flame_length
                
                base_screen = self._world_to_screen((base_world_x, base_world_y))
                tip_screen = self._world_to_screen((tip_world_x, tip_world_y))
                
                flame_color = NEON_COLORS['orange']
                NeonRenderer.draw_neon_line(self.screen, base_screen, tip_screen, flame_color, thickness=4)
                
                pygame.draw.circle(self.screen, (*NEON_COLORS['yellow'], 100), tip_screen, 8)
    
    def _draw_asteroids(self):
        for body, shape in self.asteroids:
            if isinstance(shape, pymunk.Circle):
                radius = int(shape.radius)
                screen_pos = self._world_to_screen(body.position)
                
                if (0 <= screen_pos[0] <= SCREEN_WIDTH and 
                    0 <= screen_pos[1] <= SCREEN_HEIGHT):
                    
                    pygame.draw.circle(self.screen, (*NEON_COLORS['white'], 20), screen_pos, radius)
                    
                    num_segments = max(6, int(radius / 5))
                    points = []
                    for i in range(num_segments):
                        angle = i * 2 * math.pi / num_segments + body.angle
                        variation = math.sin(angle * 3) * (radius * 0.2)
                        r = radius + variation
                        x = screen_pos[0] + math.cos(angle) * r
                        y = screen_pos[1] + math.sin(angle) * r
                        points.append((int(x), int(y)))
                    
                    for i in range(num_segments):
                        start = points[i]
                        end = points[(i + 1) % num_segments]
                        pygame.draw.line(self.screen, NEON_COLORS['white'], start, end, 2)
    
    def _draw_starfield(self):
        star_seed = int(self.camera_x // 100) + int(self.camera_y // 100) * 1000
        random.seed(star_seed)
        
        for _ in range(50):
            offset_x = random.randint(-200, SCREEN_WIDTH + 200)
            offset_y = random.randint(-200, SCREEN_HEIGHT + 200)
            
            star_x = int(offset_x - self.camera_x * 0.1) % (SCREEN_WIDTH + 400) - 200
            star_y = int(offset_y - self.camera_y * 0.1) % (SCREEN_HEIGHT + 400) - 200
            
            brightness = random.randint(100, 255)
            size = random.randint(1, 3)
            pygame.draw.circle(self.screen, (brightness, brightness, brightness), (star_x, star_y), size)
        
        random.seed()
    
    def _draw_hud(self):
        if not self.player_body:
            return
        
        hud_x = 20
        hud_y = 80
        
        NeonRenderer.draw_neon_text(self.screen, "飞船状态", self.font_medium,
                                    (hud_x, hud_y), NEON_COLORS['cyan'], center=False)
        
        hud_y += 40
        
        velocity = self.player_body.velocity
        speed = math.sqrt(velocity.x**2 + velocity.y**2)
        NeonRenderer.draw_neon_text(self.screen, f"速度: {speed:.1f}", 
                                    self.font_small, (hud_x, hud_y), NEON_COLORS['white'], center=False)
        hud_y += 25
        
        angle_deg = math.degrees(self.player_body.angle) % 360
        NeonRenderer.draw_neon_text(self.screen, f"角度: {angle_deg:.1f}°", 
                                    self.font_small, (hud_x, hud_y), NEON_COLORS['white'], center=False)
        hud_y += 25
        
        angular_speed = math.degrees(self.player_body.angular_velocity)
        NeonRenderer.draw_neon_text(self.screen, f"转速: {angular_speed:.1f}°/s", 
                                    self.font_small, (hud_x, hud_y), NEON_COLORS['white'], center=False)
        hud_y += 40
        
        if self.thrust_active:
            NeonRenderer.draw_neon_text(self.screen, "推进器: 开启", 
                                        self.font_small, (hud_x, hud_y), NEON_COLORS['orange'], center=False)
        else:
            NeonRenderer.draw_neon_text(self.screen, "推进器: 关闭", 
                                        self.font_small, (hud_x, hud_y), NEON_COLORS['white'], center=False)
        
        control_y = SCREEN_HEIGHT - 100
        NeonRenderer.draw_neon_text(self.screen, "控制说明", self.font_medium,
                                    (SCREEN_WIDTH // 2, control_y), NEON_COLORS['magenta'])
        control_y += 30
        controls = [
            "W/↑ 推进 | A/← 左转 | D/→ 右转 | ESC 返回"
        ]
        for ctrl in controls:
            NeonRenderer.draw_neon_text(self.screen, ctrl, self.font_small,
                                        (SCREEN_WIDTH // 2, control_y), NEON_COLORS['white'])
            control_y += 20
    
    def draw(self):
        self.screen.fill(NEON_COLORS['dark_bg'])
        
        self._draw_starfield()
        self._draw_asteroids()
        self._draw_ship()
        
        self.back_button.draw(self.screen, self.font_small)
        self.reset_button.draw(self.screen, self.font_small)
        
        self._draw_hud()
        
        NeonRenderer.draw_neon_text(self.screen, "飞行训练", self.font_large,
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
        
        for body, shape in self.asteroids:
            self.space.remove(body, shape)
        self.asteroids.clear()
        
        if self.player_body:
            for shape in self.player_shapes:
                self.space.remove(shape)
            self.space.remove(self.player_body)
        
        return self.next_state
