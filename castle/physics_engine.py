import pymunk
import pygame
from config import (
    GRAVITY, DAMPING, GROUND_Y, SCREEN_WIDTH, SCREEN_HEIGHT,
    PhysicsLayers, Colors, GRID_SIZE
)

class PhysicsEngine:
    def __init__(self):
        self.space = pymunk.Space()
        self.space.gravity = (0, GRAVITY)
        self.space.damping = DAMPING
        
        self.ground_body = pymunk.Body(body_type=pymunk.Body.STATIC)
        self.ground_shape = pymunk.Segment(
            self.ground_body,
            (0, GROUND_Y),
            (SCREEN_WIDTH, GROUND_Y),
            5.0
        )
        self.ground_shape.friction = 0.8
        self.ground_shape.elasticity = 0.1
        self.ground_shape.filter = pymunk.ShapeFilter(
            categories=PhysicsLayers.GROUND,
            mask=pymunk.ShapeFilter.ALL_MASKS()
        )
        self.space.add(self.ground_body, self.ground_shape)
        
        self.left_wall = pymunk.Body(body_type=pymunk.Body.STATIC)
        self.left_wall_shape = pymunk.Segment(
            self.left_wall,
            (-20, 0),
            (-20, SCREEN_HEIGHT),
            1.0
        )
        self.right_wall = pymunk.Body(body_type=pymunk.Body.STATIC)
        self.right_wall_shape = pymunk.Segment(
            self.right_wall,
            (SCREEN_WIDTH + 20, 0),
            (SCREEN_WIDTH + 20, SCREEN_HEIGHT),
            1.0
        )
        self.space.add(self.left_wall, self.left_wall_shape)
        self.space.add(self.right_wall, self.right_wall_shape)
        
        self.collision_handlers = {}
        self._setup_default_collisions()
        
        self.physics_objects = []
    
    def _setup_default_collisions(self):
        projectile_filter = PhysicsLayers.PROJECTILE
        building_filter = PhysicsLayers.BUILDING
        
        handler = self.space.add_collision_handler(
            projectile_filter, building_filter
        )
        handler.begin = self._on_projectile_hit_building
        
        handler2 = self.space.add_collision_handler(
            projectile_filter, PhysicsLayers.GROUND
        )
        handler2.begin = self._on_projectile_hit_ground
    
    def _on_projectile_hit_building(self, arbiter, space, data):
        projectile_shape = arbiter.shapes[0]
        building_shape = arbiter.shapes[1]
        
        if hasattr(projectile_shape, 'damage') and hasattr(building_shape, 'health'):
            impulse = arbiter.total_impulse
            damage = projectile_shape.damage + (impulse.length * 0.01)
            building_shape.health -= damage
            
            if building_shape.health <= 0:
                self._destroy_building(building_shape, space)
        
        return True
    
    def _on_projectile_hit_ground(self, arbiter, space, data):
        projectile_shape = arbiter.shapes[0]
        if hasattr(projectile_shape, 'is_projectile'):
            def remove_projectile(space, shape):
                if shape.body in space.bodies:
                    space.remove(shape.body, shape)
            space.add_post_step_callback(remove_projectile, projectile_shape)
        return True
    
    def _destroy_building(self, shape, space):
        body = shape.body
        if body in space.bodies:
            debris = self._create_debris(body, shape)
            for debris_body, debris_shape in debris:
                space.add(debris_body, debris_shape)
                self.physics_objects.append(debris_shape)
            
            def remove_shape(space, body, shape):
                if body in space.bodies:
                    space.remove(body, shape)
            space.add_post_step_callback(remove_shape, body, shape)
            
            if shape in self.physics_objects:
                self.physics_objects.remove(shape)
    
    def _create_debris(self, original_body, original_shape):
        debris_list = []
        pos = original_body.position
        angle = original_body.angle
        
        if isinstance(original_shape, pymunk.Poly):
            vertices = original_shape.get_vertices()
            width = max(v.x for v in vertices) - min(v.x for v in vertices)
            height = max(v.y for v in vertices) - min(v.y for v in vertices)
        else:
            width = GRID_SIZE
            height = GRID_SIZE
        
        num_debris = 4
        for i in range(num_debris):
            debris_width = width / 2
            debris_height = height / 2
            
            debris_body = pymunk.Body(
                original_body.mass / 2,
                pymunk.moment_for_box(original_body.mass / 2, (debris_width, debris_height))
            )
            debris_body.position = pos
            debris_body.angle = angle
            
            offset_x = (i % 2 - 0.5) * debris_width
            offset_y = (i // 2 - 0.5) * debris_height
            debris_body.position += pymunk.Vec2d(offset_x, offset_y).rotated(angle)
            
            debris_body.velocity = original_body.velocity * 0.8
            debris_body.angular_velocity = original_body.angular_velocity * 1.2
            
            debris_shape = pymunk.Poly.create_box(debris_body, (debris_width, debris_height))
            debris_shape.friction = original_shape.friction
            debris_shape.elasticity = original_shape.elasticity
            debris_shape.color = getattr(original_shape, 'color', Colors.STONE)
            debris_shape.is_debris = True
            debris_shape.filter = pymunk.ShapeFilter(
                categories=PhysicsLayers.DEBRIS,
                mask=PhysicsLayers.GROUND | PhysicsLayers.DEBRIS
            )
            
            debris_list.append((debris_body, debris_shape))
        
        return debris_list
    
    def add_building_block(self, x, y, width, height, density, friction, elasticity, color, health, flammable=False):
        body = pymunk.Body(
            density * width * height,
            pymunk.moment_for_box(density * width * height, (width, height))
        )
        body.position = (x, y)
        
        shape = pymunk.Poly.create_box(body, (width, height))
        shape.friction = friction
        shape.elasticity = elasticity
        shape.color = color
        shape.health = health
        shape.max_health = health
        shape.flammable = flammable
        shape.is_on_fire = False
        shape.burn_time = 0
        shape.is_building = True
        
        shape.filter = pymunk.ShapeFilter(
            categories=PhysicsLayers.BUILDING,
            mask=pymunk.ShapeFilter.ALL_MASKS()
        )
        
        self.space.add(body, shape)
        self.physics_objects.append(shape)
        
        return body, shape
    
    def add_projectile(self, x, y, radius, mass, velocity, damage, is_fire=False, color=Colors.STONE_DARK):
        body = pymunk.Body(
            mass,
            pymunk.moment_for_circle(mass, 0, radius)
        )
        body.position = (x, y)
        body.velocity = velocity
        
        shape = pymunk.Circle(body, radius)
        shape.damage = damage
        shape.mass = mass
        shape.is_projectile = True
        shape.is_fire = is_fire
        shape.color = Colors.FIRE if is_fire else color
        shape.friction = 0.3
        shape.elasticity = 0.5
        
        shape.filter = pymunk.ShapeFilter(
            categories=PhysicsLayers.PROJECTILE,
            mask=PhysicsLayers.BUILDING | PhysicsLayers.GROUND | PhysicsLayers.UNIT
        )
        
        self.space.add(body, shape)
        self.physics_objects.append(shape)
        
        return body, shape
    
    def add_unit(self, x, y, width, height, mass, speed, color):
        body = pymunk.Body(
            mass,
            pymunk.moment_for_box(mass, (width, height))
        )
        body.position = (x, y)
        
        shape = pymunk.Poly.create_box(body, (width, height))
        shape.friction = 0.8
        shape.elasticity = 0.1
        shape.color = color
        shape.speed = speed
        shape.is_unit = True
        
        shape.filter = pymunk.ShapeFilter(
            categories=PhysicsLayers.UNIT,
            mask=PhysicsLayers.GROUND | PhysicsLayers.BUILDING | PhysicsLayers.UNIT | PhysicsLayers.PROJECTILE
        )
        
        self.space.add(body, shape)
        self.physics_objects.append(shape)
        
        return body, shape
    
    def remove_object(self, shape):
        if shape.body in self.space.bodies:
            self.space.remove(shape.body, shape)
        if shape in self.physics_objects:
            self.physics_objects.remove(shape)
    
    def clear_all_dynamic(self):
        to_remove = []
        for shape in self.physics_objects:
            if hasattr(shape, 'is_projectile') or hasattr(shape, 'is_debris') or hasattr(shape, 'is_unit'):
                to_remove.append(shape)
        
        for shape in to_remove:
            self.remove_object(shape)
    
    def update(self, dt):
        self.space.step(dt)
        
        for shape in list(self.physics_objects):
            if hasattr(shape, 'is_on_fire') and shape.is_on_fire:
                shape.burn_time += dt * 1000
                if hasattr(shape, 'health'):
                    shape.health -= 0.5
                
                if hasattr(shape, 'burn_time') and shape.burn_time > shape.burn_time:
                    self._destroy_building(shape, self.space)
    
    def render_ground(self, surface):
        pygame.draw.rect(
            surface,
            Colors.GROUND,
            (0, GROUND_Y, SCREEN_WIDTH, SCREEN_HEIGHT - GROUND_Y)
        )
        
        pygame.draw.line(
            surface,
            Colors.PARCHMENT_DARK,
            (0, GROUND_Y),
            (SCREEN_WIDTH, GROUND_Y),
            2
        )
    
    def render_objects(self, surface, camera_offset=(0, 0)):
        for shape in self.physics_objects:
            if hasattr(shape, 'body') and shape.body:
                body = shape.body
                pos = body.position - pymunk.Vec2d(camera_offset[0], camera_offset[1])
                
                if isinstance(shape, pymunk.Circle):
                    radius = shape.radius
                    pygame.draw.circle(
                        surface,
                        getattr(shape, 'color', Colors.WHITE),
                        (int(pos.x), int(pos.y)),
                        int(radius)
                    )
                    
                    if getattr(shape, 'is_fire', False):
                        for i in range(3):
                            offset = pymunk.Vec2d(
                                pygame.time.get_ticks() % 10 * (i - 1),
                                -pygame.time.get_ticks() % 5
                            )
                            pygame.draw.circle(
                                surface,
                                Colors.FIRE_LIGHT,
                                (int(pos.x + offset.x), int(pos.y + offset.y)),
                                int(radius * 0.5)
                            )
                
                elif isinstance(shape, pymunk.Poly):
                    vertices = shape.get_vertices()
                    rotated_vertices = [
                        v.rotated(body.angle) + pos
                        for v in vertices
                    ]
                    pygame_vertices = [(int(v.x), int(v.y)) for v in rotated_vertices]
                    
                    color = getattr(shape, 'color', Colors.STONE)
                    pygame.draw.polygon(surface, color, pygame_vertices)
                    
                    if hasattr(shape, 'health') and hasattr(shape, 'max_health') and shape.health < shape.max_health:
                        health_ratio = shape.health / shape.max_health
                        if health_ratio < 0.7:
                            damage_color = Colors.BLOOD if health_ratio < 0.3 else Colors.ACCENT_RED
                            for i in range(len(pygame_vertices)):
                                p1 = pygame_vertices[i]
                                p2 = pygame_vertices[(i + 1) % len(pygame_vertices)]
                                if pygame.time.get_ticks() % 100 < 50:
                                    pygame.draw.line(surface, damage_color, p1, p2, 1)
                    
                    if getattr(shape, 'is_on_fire', False):
                        for i in range(2):
                            flame_pos = (
                                int(pos.x + (pygame.time.get_ticks() % 20 - 10) * 0.1),
                                int(pos.y - 10)
                            )
                            pygame.draw.circle(surface, Colors.FIRE, flame_pos, 5)
                            pygame.draw.circle(surface, Colors.FIRE_LIGHT, flame_pos, 3)
                    
                    pygame.draw.polygon(surface, Colors.DARK_IRON, pygame_vertices, 1)
                
                elif isinstance(shape, pymunk.Segment):
                    if shape != self.ground_shape:
                        start = shape.a.rotated(body.angle) + body.position
                        end = shape.b.rotated(body.angle) + body.position
                        pygame.draw.line(
                            surface,
                            getattr(shape, 'color', Colors.WHITE),
                            (int(start.x), int(start.y)),
                            (int(end.x), int(end.y)),
                            int(shape.radius)
                        )
