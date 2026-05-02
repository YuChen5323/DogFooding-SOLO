import pygame
import pymunk
import math
from scenes.base_scene import BaseScene
from ui.components import Button, Panel, Label, SelectionGrid, HealthBar, ResourceBar
from physics_engine import PhysicsEngine
from config import (
    Colors, GameStates, SCREEN_WIDTH, SCREEN_HEIGHT, GROUND_Y,
    SiegeWeapons, BuildingTypes, UnitTypes, Resources, PhysicsLayers, GRID_SIZE
)

class BattleScene(BaseScene):
    def __init__(self, game):
        super().__init__(game)
        self.physics = None
        self.is_paused = False
        self.game_time = 0
        
        self.player_resources = Resources.STARTING.copy()
        self.enemy_units = []
        self.player_units = []
        self.projectiles = []
        self.siege_weapons = []
        
        self.selected_weapon = None
        self.aim_angle = 45
        self.aim_power = 50
        self.is_aiming = False
        self.aim_start_pos = None
        
        self.wave = 1
        self.max_waves = 5
        self.wave_timer = 0
        self.wave_delay = 10
        self.is_wave_active = False
        self.enemies_spawned = 0
        self.enemies_to_spawn = 0
        self.spawn_timer = 0
        self.spawn_delay = 1.5
        
        self.castle_health = 1000
        self.max_castle_health = 1000
        
        self._create_ui()
    
    def _create_ui(self):
        self.top_panel = Panel(0, 0, SCREEN_WIDTH, 80, bg_color=Colors.PANEL, border_width=0)
        
        self.btn_back = Button(10, 10, 80, 40, "返回", self.font_small, action=self._go_back)
        self.btn_pause = Button(100, 10, 80, 40, "暂停", self.font_small, action=self._toggle_pause)
        
        self.lbl_wave = Label(200, 20, f"波次: {self.wave}/{self.max_waves}", self.font_medium, Colors.PARCHMENT)
        self.lbl_timer = Label(400, 20, "下一波: 准备中", self.font_medium, Colors.PARCHMENT_DARK)
        
        self.castle_hp_bar = HealthBar(600, 15, 200, 30, self.max_castle_health, self.castle_health)
        
        self.resource_bar = ResourceBar(820, 10, 350, 60, self.player_resources, self.font_small)
        
        self.top_panel.add_component(self.btn_back)
        self.top_panel.add_component(self.btn_pause)
        self.top_panel.add_component(self.lbl_wave)
        self.top_panel.add_component(self.lbl_timer)
        self.top_panel.add_component(self.castle_hp_bar)
        self.top_panel.add_component(self.resource_bar)
        
        self.side_panel = Panel(SCREEN_WIDTH - 180, 80, 180, SCREEN_HEIGHT - 80, bg_color=Colors.PANEL)
        
        self.weapon_grid = SelectionGrid(SCREEN_WIDTH - 160, 100, 2, 2, 70, padding=10)
        
        weapons = [
            ('CATAPULT', SiegeWeapons.CATAPULT),
            ('FIRE_ARROW', SiegeWeapons.FIRE_ARROW),
            ('BATTERING_RAM', SiegeWeapons.BATTERING_RAM),
            ('SIEGE_TOWER', SiegeWeapons.SIEGE_TOWER),
        ]
        
        for key, weapon_data in weapons:
            surf = pygame.Surface((70, 70))
            surf.fill(Colors.DARK_IRON)
            weapon_surf = pygame.Surface((60, 60))
            weapon_surf.fill(weapon_data['color'])
            surf.blit(weapon_surf, (5, 5))
            self.weapon_grid.add_item({'key': key, 'data': weapon_data}, surf)
        
        if self.weapon_grid.items:
            self.weapon_grid.selected_index = 0
            selected = self.weapon_grid.items[0]['data']
            self.selected_weapon = selected['data']
        
        self.btn_fire = Button(SCREEN_WIDTH - 160, 350, 140, 50, "发射/部署", self.font_medium, action=self._fire_or_deploy)
        
        self.defense_panel = Panel(SCREEN_WIDTH - 170, 420, 160, 200, bg_color=Colors.DARK_IRON)
        
        self.lbl_defense = Label(SCREEN_WIDTH - 160, 430, "防御技能", self.font_small, Colors.PARCHMENT)
        
        self.btn_archers = Button(SCREEN_WIDTH - 160, 460, 140, 35, "弓箭手 (20金)", self.font_small, action=self._spawn_archers)
        self.btn_oil = Button(SCREEN_WIDTH - 160, 505, 140, 35, "浇热油 (5油)", self.font_small, action=self._pour_oil)
        
        self.defense_panel.add_component(self.lbl_defense)
        self.defense_panel.add_component(self.btn_archers)
        self.defense_panel.add_component(self.btn_oil)
    
    def on_enter(self):
        self.physics = PhysicsEngine()
        self._load_default_castle()
        self._reset_battle()
    
    def _reset_battle(self):
        self.game_time = 0
        self.wave = 1
        self.wave_timer = 0
        self.is_wave_active = False
        self.enemies_spawned = 0
        self.spawn_timer = 0
        self.castle_health = self.max_castle_health
        self.castle_hp_bar.set_health(self.castle_health)
        self.player_resources = Resources.STARTING.copy()
        self.resource_bar.update_resources(self.player_resources)
        
        self.enemy_units = []
        self.player_units = []
        self.projectiles = []
        self.siege_weapons = []
        
        self.physics.clear_all_dynamic()
        
        self.lbl_wave.set_text(f"波次: {self.wave}/{self.max_waves}")
        self.lbl_timer.set_text("下一波: 10秒")
    
    def _load_default_castle(self):
        center_x = SCREEN_WIDTH // 2
        ground_y = GROUND_Y
        
        castle_blocks = [
            (14, 15, 'STONE_BLOCK'), (15, 15, 'STONE_BLOCK'), (16, 15, 'STONE_BLOCK'),
            (17, 15, 'STONE_BLOCK'), (18, 15, 'STONE_BLOCK'),
            (14, 14, 'STONE_BLOCK'), (15, 14, 'STONE_BLOCK'), (16, 14, 'STONE_BLOCK'),
            (17, 14, 'STONE_BLOCK'), (18, 14, 'STONE_BLOCK'),
            (15, 13, 'STONE_BLOCK'), (16, 13, 'STONE_BLOCK'), (17, 13, 'STONE_BLOCK'),
            (14, 12, 'STONE_CORNER'), (18, 12, 'STONE_CORNER'),
            (15, 11, 'WOOD_BEAM'), (16, 11, 'WOOD_BEAM'),
        ]
        
        grid_origin_x = center_x - 16 * GRID_SIZE
        grid_origin_y = ground_y - 18 * GRID_SIZE
        
        for grid_x, grid_y, type_key in castle_blocks:
            world_x = grid_origin_x + grid_x * GRID_SIZE + GRID_SIZE // 2
            world_y = grid_origin_y + grid_y * GRID_SIZE + GRID_SIZE // 2
            
            block_type = getattr(BuildingTypes, type_key, BuildingTypes.STONE_BLOCK)
            
            body, shape = self.physics.add_building_block(
                world_x, world_y,
                block_type['width'], block_type['height'],
                block_type['density'],
                block_type['friction'],
                block_type['elasticity'],
                block_type['color'],
                block_type['health'],
                block_type['flammable']
            )
            
            if block_type.get('flammable'):
                shape.burn_time = block_type.get('burn_time', 5000)
    
    def on_exit(self):
        pass
    
    def _go_back(self):
        self.game.change_state(GameStates.MENU)
    
    def _toggle_pause(self):
        self.is_paused = not self.is_paused
        self.btn_pause.text = "继续" if self.is_paused else "暂停"
    
    def _fire_or_deploy(self):
        if self.selected_weapon:
            weapon_key = self.weapon_grid.items[self.weapon_grid.selected_index]['data']['key']
            
            if weapon_key in ['CATAPULT', 'FIRE_ARROW']:
                self._fire_projectile(weapon_key)
            else:
                self._deploy_siege_weapon(weapon_key)
    
    def _fire_projectile(self, weapon_key):
        weapon_data = self.selected_weapon
        
        cost = weapon_data.get('cost', {})
        if not self._check_resources(cost):
            return
        
        self._spend_resources(cost)
        
        start_x = 100
        start_y = GROUND_Y - 50
        
        angle_rad = math.radians(self.aim_angle)
        speed = self.aim_power * 10
        
        velocity = (
            math.cos(angle_rad) * speed,
            -math.sin(angle_rad) * speed
        )
        
        is_fire = weapon_key == 'FIRE_ARROW'
        radius = 15 if weapon_key == 'CATAPULT' else 8
        mass = weapon_data.get('projectile_mass', 10)
        damage = weapon_data.get('damage', 30)
        
        body, shape = self.physics.add_projectile(
            start_x, start_y, radius, mass, velocity, damage, is_fire
        )
        
        self.projectiles.append({
            'body': body,
            'shape': shape,
            'is_fire': is_fire,
            'weapon_key': weapon_key
        })
    
    def _deploy_siege_weapon(self, weapon_key):
        weapon_data = self.selected_weapon
        
        cost = weapon_data.get('cost', {})
        if not self._check_resources(cost):
            return
        
        self._spend_resources(cost)
        
        deploy_x = 150
        deploy_y = GROUND_Y - 40
        
        if weapon_key == 'BATTERING_RAM':
            from config import UnitTypes
            for i in range(3):
                self._spawn_enemy_unit('INFANTRY', deploy_x + i * 40, deploy_y)
        
        elif weapon_key == 'SIEGE_TOWER':
            for i in range(5):
                self._spawn_enemy_unit('INFANTRY', deploy_x + (i % 2) * 30, deploy_y - i * 20)
    
    def _spawn_archers(self):
        cost = {'gold': 20}
        if not self._check_resources(cost):
            return
        
        self._spend_resources(cost)
        
        spawn_x = SCREEN_WIDTH - 300
        spawn_y = GROUND_Y - 30
        
        unit_data = UnitTypes.ARCHER
        
        body, shape = self.physics.add_unit(
            spawn_x, spawn_y,
            24, 36,
            10, 0,
            unit_data['color']
        )
        
        self.player_units.append({
            'type': 'ARCHER',
            'body': body,
            'shape': shape,
            'health': unit_data['health'],
            'max_health': unit_data['health'],
            'attack_timer': 0,
            'attack_speed': unit_data['attack_speed'],
            'range': unit_data['range'],
            'damage': unit_data['damage']
        })
    
    def _pour_oil(self):
        cost = {'oil': 5}
        if not self._check_resources(cost):
            return
        
        self._spend_resources(cost)
        
        pour_x = SCREEN_WIDTH // 2
        pour_y = GROUND_Y - 200
        
        for i in range(10):
            offset_x = (i - 5) * 20
            body, shape = self.physics.add_projectile(
                pour_x + offset_x, pour_y - i * 50,
                10, 5, (offset_x * 2, 50), 10, False, Colors.OIL
            )
            
            self.projectiles.append({
                'body': body,
                'shape': shape,
                'is_fire': False,
                'is_oil': True,
                'weapon_key': 'OIL'
            })
        
        for enemy in self.enemy_units[:]:
            enemy_pos = enemy['body'].position
            if abs(enemy_pos.x - pour_x) < 150:
                enemy['health'] -= 40
                if enemy['health'] <= 0:
                    self._remove_enemy(enemy)
    
    def _check_resources(self, cost):
        for res_name, amount in cost.items():
            if self.player_resources.get(res_name, 0) < amount:
                return False
        return True
    
    def _spend_resources(self, cost):
        for res_name, amount in cost.items():
            if res_name in self.player_resources:
                self.player_resources[res_name] -= amount
        self.resource_bar.update_resources(self.player_resources)
    
    def _spawn_enemy_unit(self, unit_type, x, y):
        unit_data = getattr(UnitTypes, unit_type, UnitTypes.INFANTRY)
        
        body, shape = self.physics.add_unit(
            x, y,
            24, 36,
            15, unit_data.get('speed', 50),
            unit_data['color']
        )
        
        self.enemy_units.append({
            'type': unit_type,
            'body': body,
            'shape': shape,
            'health': unit_data['health'],
            'max_health': unit_data['health'],
            'attack_timer': 0,
            'attack_speed': unit_data['attack_speed'],
            'range': unit_data['range'],
            'damage': unit_data['damage'],
            'speed': unit_data.get('speed', 50),
            'target_x': SCREEN_WIDTH // 2
        })
    
    def _remove_enemy(self, enemy):
        if enemy in self.enemy_units:
            self.physics.remove_object(enemy['shape'])
            self.enemy_units.remove(enemy)
    
    def handle_event(self, event):
        self.top_panel.handle_event(event)
        self.side_panel.handle_event(event)
        self.weapon_grid.handle_event(event)
        self.defense_panel.handle_event(event)
        self.btn_fire.handle_event(event)
        
        selected = self.weapon_grid.get_selected_data()
        if selected:
            self.selected_weapon = selected['data']
        
        if event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1 and event.pos[0] < SCREEN_WIDTH - 180:
                self.is_aiming = True
                self.aim_start_pos = event.pos
        
        elif event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1 and self.is_aiming:
                self.is_aiming = False
                self.aim_start_pos = None
        
        elif event.type == pygame.MOUSEMOTION:
            if self.is_aiming and self.aim_start_pos:
                dx = event.pos[0] - self.aim_start_pos[0]
                dy = event.pos[1] - self.aim_start_pos[1]
                
                self.aim_angle = max(10, min(80, 45 - dy * 0.5))
                self.aim_power = max(20, min(100, 50 + dx * 0.2))
        
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_SPACE:
                self._fire_or_deploy()
            elif event.key == pygame.K_a:
                self._spawn_archers()
            elif event.key == pygame.K_o:
                self._pour_oil()
    
    def update(self, dt):
        if self.is_paused:
            return
        
        self.game_time += dt
        self.physics.update(dt)
        
        if not self.is_wave_active:
            self.wave_timer += dt
            remaining = max(0, self.wave_delay - self.wave_timer)
            self.lbl_timer.set_text(f"下一波: {remaining:.1f}秒")
            
            if self.wave_timer >= self.wave_delay:
                self._start_wave()
        else:
            self.lbl_timer.set_text(f"波次进行中...")
            self._update_wave(dt)
        
        self._update_enemies(dt)
        self._update_player_units(dt)
        self._update_projectiles()
        self._check_victory()
    
    def _start_wave(self):
        self.is_wave_active = True
        self.enemies_spawned = 0
        self.enemies_to_spawn = 3 + self.wave * 2
        self.spawn_timer = 0
        self.lbl_wave.set_text(f"波次: {self.wave}/{self.max_waves}")
    
    def _update_wave(self, dt):
        self.spawn_timer += dt
        
        if self.enemies_spawned < self.enemies_to_spawn and self.spawn_timer >= self.spawn_delay:
            self.spawn_timer = 0
            
            spawn_x = 50
            spawn_y = GROUND_Y - 40
            
            if self.wave >= 3 and self.enemies_spawned == self.enemies_to_spawn - 1:
                self._spawn_enemy_unit('KNIGHT', spawn_x, spawn_y)
            else:
                self._spawn_enemy_unit('INFANTRY', spawn_x, spawn_y)
            
            self.enemies_spawned += 1
        
        if self.enemies_spawned >= self.enemies_to_spawn and len(self.enemy_units) == 0:
            self.is_wave_active = False
            self.wave_timer = 0
            self.wave += 1
            
            self.player_resources['gold'] += 30
            self.player_resources['stone'] += 10
            self.player_resources['wood'] += 10
            self.resource_bar.update_resources(self.player_resources)
            
            if self.wave > self.max_waves:
                self.game.change_state(GameStates.VICTORY)
    
    def _update_enemies(self, dt):
        for enemy in self.enemy_units[:]:
            body = enemy['body']
            
            if body.position.x < enemy['target_x']:
                body.velocity = (enemy['speed'], body.velocity.y)
            else:
                body.velocity = (0, body.velocity.y)
                enemy['attack_timer'] += dt
                
                if enemy['attack_timer'] >= enemy['attack_speed']:
                    enemy['attack_timer'] = 0
                    self.castle_health -= enemy['damage']
                    self.castle_hp_bar.set_health(self.castle_health)
                    
                    if self.castle_health <= 0:
                        self.game.change_state(GameStates.DEFEAT)
            
            if enemy['health'] <= 0:
                self._remove_enemy(enemy)
    
    def _update_player_units(self, dt):
        for unit in self.player_units[:]:
            unit['attack_timer'] += dt
            
            if unit['attack_timer'] >= unit['attack_speed']:
                unit['attack_timer'] = 0
                
                for enemy in self.enemy_units:
                    dx = enemy['body'].position.x - unit['body'].position.x
                    dy = enemy['body'].position.y - unit['body'].position.y
                    distance = math.sqrt(dx * dx + dy * dy)
                    
                    if distance < unit['range']:
                        angle = math.atan2(-dy, dx)
                        speed = 300
                        
                        body, shape = self.physics.add_projectile(
                            unit['body'].position.x,
                            unit['body'].position.y,
                            4, 2,
                            (math.cos(angle) * speed, math.sin(angle) * speed),
                            unit['damage'],
                            False, Colors.ACCENT_GREEN
                        )
                        
                        self.projectiles.append({
                            'body': body,
                            'shape': shape,
                            'is_fire': False,
                            'weapon_key': 'ARROW',
                            'is_player': True
                        })
                        
                        enemy['health'] -= unit['damage']
                        break
    
    def _update_projectiles(self):
        to_remove = []
        for proj in self.projectiles:
            body = proj['body']
            
            if body.position.y > SCREEN_HEIGHT + 50 or body.position.x < -50 or body.position.x > SCREEN_WIDTH + 50:
                to_remove.append(proj)
                continue
            
            if not proj.get('is_player', False):
                for shape in self.physics.physics_objects:
                    if hasattr(shape, 'is_building') and shape.is_building:
                        if self._check_collision(body.position, proj['shape'].radius, shape):
                            if proj.get('is_fire', False) and shape.flammable:
                                shape.is_on_fire = True
                            to_remove.append(proj)
                            break
        
        for proj in to_remove:
            if proj in self.projectiles:
                self.physics.remove_object(proj['shape'])
                self.projectiles.remove(proj)
    
    def _check_collision(self, pos, radius, shape):
        if isinstance(shape, pymunk.Poly):
            shape_pos = shape.body.position
            dx = abs(pos.x - shape_pos.x)
            dy = abs(pos.y - shape_pos.y)
            
            vertices = shape.get_vertices()
            shape_width = max(v.x for v in vertices) - min(v.x for v in vertices)
            shape_height = max(v.y for v in vertices) - min(v.y for v in vertices)
            
            return dx < (shape_width / 2 + radius) and dy < (shape_height / 2 + radius)
        return False
    
    def _check_victory(self):
        if self.castle_health <= 0:
            self.game.change_state(GameStates.DEFEAT)
    
    def render(self, surface):
        self.draw_background(surface)
        self.physics.render_ground(surface)
        self.physics.render_objects(surface)
        
        self._draw_units(surface)
        self._draw_aim_line(surface)
        
        self.top_panel.render(surface)
        self.side_panel.render(surface)
        self.weapon_grid.render(surface)
        self.defense_panel.render(surface)
        self.btn_fire.render(surface)
        
        if self.weapon_grid.hovered_index >= 0:
            item = self.weapon_grid.items[self.weapon_grid.hovered_index]
            name = item['data']['data'].get('name', 'Unknown')
            desc = item['data']['data'].get('description', '')
            
            info_surface = self.font_small.render(f"{name}: {desc}", True, Colors.PARCHMENT)
            surface.blit(info_surface, (10, 90))
        
        aim_surface = self.font_small.render(
            f"角度: {self.aim_angle:.0f}°  力度: {self.aim_power:.0f}",
            True, Colors.PARCHMENT
        )
        surface.blit(aim_surface, (10, 120))
    
    def _draw_units(self, surface):
        for enemy in self.enemy_units:
            body = enemy['body']
            shape = enemy['shape']
            
            x = int(body.position.x)
            y = int(body.position.y)
            
            vertices = shape.get_vertices()
            rotated_vertices = [
                v.rotated(body.angle) + body.position
                for v in vertices
            ]
            pygame_vertices = [(int(v.x), int(v.y)) for v in rotated_vertices]
            
            pygame.draw.polygon(surface, shape.color, pygame_vertices)
            pygame.draw.polygon(surface, Colors.DARK_IRON, pygame_vertices, 1)
            
            hp_ratio = enemy['health'] / enemy['max_health']
            bar_width = 30
            bar_height = 4
            pygame.draw.rect(surface, Colors.DARK_IRON, (x - bar_width // 2, y - 30, bar_width, bar_height))
            if hp_ratio > 0.5:
                hp_color = Colors.ACCENT_GREEN
            elif hp_ratio > 0.25:
                hp_color = Colors.ACCENT_GOLD
            else:
                hp_color = Colors.ACCENT_RED
            pygame.draw.rect(surface, hp_color, (x - bar_width // 2, y - 30, int(bar_width * hp_ratio), bar_height))
        
        for unit in self.player_units:
            body = unit['body']
            shape = unit['shape']
            
            x = int(body.position.x)
            y = int(body.position.y)
            
            vertices = shape.get_vertices()
            rotated_vertices = [
                v.rotated(body.angle) + body.position
                for v in vertices
            ]
            pygame_vertices = [(int(v.x), int(v.y)) for v in rotated_vertices]
            
            pygame.draw.polygon(surface, shape.color, pygame_vertices)
            pygame.draw.polygon(surface, Colors.ACCENT_BLUE, pygame_vertices, 1)
            
            hp_ratio = unit['health'] / unit['max_health']
            bar_width = 30
            bar_height = 4
            pygame.draw.rect(surface, Colors.DARK_IRON, (x - bar_width // 2, y - 30, bar_width, bar_height))
            pygame.draw.rect(surface, Colors.ACCENT_GREEN, (x - bar_width // 2, y - 30, int(bar_width * hp_ratio), bar_height))
    
    def _draw_aim_line(self, surface):
        start_x = 100
        start_y = GROUND_Y - 50
        
        angle_rad = math.radians(self.aim_angle)
        speed = self.aim_power * 10
        
        vx = math.cos(angle_rad) * speed
        vy = -math.sin(angle_rad) * speed
        
        preview_points = []
        x, y = start_x, start_y
        dt = 0.05
        
        for i in range(50):
            preview_points.append((int(x), int(y)))
            x += vx * dt
            y += vy * dt
            vy += 900 * dt
            
            if y > GROUND_Y:
                break
        
        if len(preview_points) > 1:
            pygame.draw.lines(surface, Colors.PARCHMENT_DARK, False, preview_points, 2)
            
            for i, (px, py) in enumerate(preview_points[::5]):
                pygame.draw.circle(surface, Colors.ACCENT_GOLD, (px, py), 3)
