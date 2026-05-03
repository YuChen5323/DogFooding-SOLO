import { Droplet, Channel, Point, SimulationResult, SimulationParameters, FluidType } from '../types';

export class AnimationSystem {
  private droplets: Droplet[] = [];
  private particles: {
    id: number;
    position: Point;
    velocity: Point;
    size: number;
    color: string;
    phase: FluidType;
  }[] = [];
  private nextDropletId: number = 0;
  private nextParticleId: number = 0;
  private simulationResult: SimulationResult | null = null;
  private parameters: SimulationParameters | null = null;
  private channels: Channel[] = [];
  private timeAccumulator: number = 0;
  private dropletGenerationInterval: number = 0;

  public updateSimulation(
    result: SimulationResult,
    parameters: SimulationParameters,
    channels: Channel[]
  ): void {
    this.simulationResult = result;
    this.parameters = parameters;
    this.channels = channels;
    
    if (result.dropletFrequency > 0) {
      this.dropletGenerationInterval = 1000 / result.dropletFrequency;
    }
  }

  public update(deltaTime: number, isSimulating: boolean): {
    droplets: Droplet[];
    particles: {
      id: number;
      position: Point;
      velocity: Point;
      size: number;
      color: string;
      phase: FluidType;
    }[];
  } {
    if (!isSimulating || !this.simulationResult || !this.parameters) {
      return { droplets: this.droplets, particles: this.particles };
    }

    this.timeAccumulator += deltaTime;
    
    if (this.dropletGenerationInterval > 0 && this.timeAccumulator >= this.dropletGenerationInterval) {
      this.generateDroplet();
      this.timeAccumulator = 0;
    }

    this.generateParticles(deltaTime);
    this.updateDroplets(deltaTime);
    this.updateParticles(deltaTime);
    this.removeOutOfBoundsEntities();

    return { droplets: this.droplets, particles: this.particles };
  }

  private generateDroplet(): void {
    if (!this.simulationResult || !this.parameters || this.channels.length === 0) return;

    const inletChannels = this.channels.filter(c => 
      c.flowDirection === 'inlet' && c.fluidType === FluidType.WATER
    );

    if (inletChannels.length === 0) return;

    const channel = inletChannels[0];
    const startPoint = { ...channel.startPoint };
    const direction = {
      x: channel.endPoint.x - channel.startPoint.x,
      y: channel.endPoint.y - channel.startPoint.y,
    };
    
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    direction.x /= length;
    direction.y /= length;

    const velocityMag = this.parameters.continuousPhaseFlowRate / (channel.width * channel.height);
    const velocity = {
      x: direction.x * velocityMag,
      y: direction.y * velocityMag,
    };

    const droplet: Droplet = {
      id: this.nextDropletId++,
      position: { ...startPoint },
      velocity,
      radius: this.simulationResult.dropletSize / 2,
      volume: this.simulationResult.dropletVolume,
      color: '#2563eb',
      channelId: channel.id,
      distanceAlongChannel: 0,
      isEncapsulated: false,
    };

    this.droplets.push(droplet);
  }

  private generateParticles(deltaTime: number): void {
    if (!this.parameters || this.channels.length === 0) return;

    const inletChannels = this.channels.filter(c => c.flowDirection === 'inlet');
    
    for (const channel of inletChannels) {
      const particleCount = Math.floor(deltaTime / 16);
      
      for (let i = 0; i < particleCount; i++) {
        const direction = {
          x: channel.endPoint.x - channel.startPoint.x,
          y: channel.endPoint.y - channel.startPoint.y,
        };
        
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        direction.x /= length;
        direction.y /= length;

        const perpendicular = { x: -direction.y, y: direction.x };
        const offset = (Math.random() - 0.5) * channel.width * 0.8;

        const startPoint = {
          x: channel.startPoint.x + perpendicular.x * offset,
          y: channel.startPoint.y + perpendicular.y * offset,
        };

        const velocityMag = this.parameters.continuousPhaseFlowRate / (channel.width * channel.height);
        const velocity = {
          x: direction.x * velocityMag * (0.8 + Math.random() * 0.4),
          y: direction.y * velocityMag * (0.8 + Math.random() * 0.4),
        };

        this.particles.push({
          id: this.nextParticleId++,
          position: startPoint,
          velocity,
          size: 2 + Math.random() * 4,
          color: channel.fluidType === FluidType.OIL ? '#fbbf24' : '#60a5fa',
          phase: channel.fluidType,
        });
      }
    }
  }

  private updateDroplets(deltaTime: number): void {
    for (const droplet of this.droplets) {
      droplet.position.x += droplet.velocity.x * deltaTime / 16;
      droplet.position.y += droplet.velocity.y * deltaTime / 16;
      droplet.distanceAlongChannel += Math.sqrt(
        droplet.velocity.x * droplet.velocity.x + droplet.velocity.y * droplet.velocity.y
      ) * deltaTime / 16;

      this.adjustDropletPath(droplet);
    }
  }

  private updateParticles(deltaTime: number): void {
    for (const particle of this.particles) {
      particle.position.x += particle.velocity.x * deltaTime / 16;
      particle.position.y += particle.velocity.y * deltaTime / 16;
    }
  }

  private adjustDropletPath(droplet: Droplet): void {
    if (this.channels.length === 0) return;

    let closestChannel: Channel | null = null;
    let closestDistance = Infinity;

    for (const channel of this.channels) {
      const dist = this.pointToSegmentDistance(
        droplet.position,
        channel.startPoint,
        channel.endPoint
      );
      
      if (dist < closestDistance) {
        closestDistance = dist;
        closestChannel = channel;
      }
    }

    if (closestChannel && closestDistance > closestChannel.width / 2) {
      const projection = this.projectPointOntoSegment(
        droplet.position,
        closestChannel.startPoint,
        closestChannel.endPoint
      );
      
      const direction = {
        x: projection.x - droplet.position.x,
        y: projection.y - droplet.position.y,
      };
      const dist = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      
      if (dist > 0) {
        direction.x /= dist;
        direction.y /= dist;
        
        const correctionStrength = 0.1;
        droplet.position.x += direction.x * correctionStrength * (dist - closestChannel.width / 2);
        droplet.position.y += direction.y * correctionStrength * (dist - closestChannel.width / 2);
      }
    }

    if (closestChannel) {
      const direction = {
        x: closestChannel.endPoint.x - closestChannel.startPoint.x,
        y: closestChannel.endPoint.y - closestChannel.startPoint.y,
      };
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      direction.x /= length;
      direction.y /= length;

      const currentSpeed = Math.sqrt(
        droplet.velocity.x * droplet.velocity.x + droplet.velocity.y * droplet.velocity.y
      );
      
      droplet.velocity.x = direction.x * currentSpeed;
      droplet.velocity.y = direction.y * currentSpeed;
    }
  }

  private pointToSegmentDistance(point: Point, start: Point, end: Point): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return Math.sqrt((point.x - start.x) ** 2 + (point.y - start.y) ** 2);
    }

    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const closestX = start.x + t * dx;
    const closestY = start.y + t * dy;

    return Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);
  }

  private projectPointOntoSegment(point: Point, start: Point, end: Point): Point {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return { ...start };
    }

    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    return {
      x: start.x + t * dx,
      y: start.y + t * dy,
    };
  }

  private removeOutOfBoundsEntities(): void {
    const maxDistance = 1000;
    
    this.droplets = this.droplets.filter(droplet => 
      droplet.position.x > -maxDistance &&
      droplet.position.x < 1000 + maxDistance &&
      droplet.position.y > -maxDistance &&
      droplet.position.y < 800 + maxDistance
    );

    this.particles = this.particles.filter(particle =>
      particle.position.x > -maxDistance &&
      particle.position.x < 1000 + maxDistance &&
      particle.position.y > -maxDistance &&
      particle.position.y < 800 + maxDistance
    );
  }

  public reset(): void {
    this.droplets = [];
    this.particles = [];
    this.nextDropletId = 0;
    this.nextParticleId = 0;
    this.timeAccumulator = 0;
  }

  public getDroplets(): Droplet[] {
    return this.droplets;
  }

  public getParticles(): {
    id: number;
    position: Point;
    velocity: Point;
    size: number;
    color: string;
    phase: FluidType;
  }[] {
    return this.particles;
  }
}
