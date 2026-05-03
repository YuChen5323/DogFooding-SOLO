import { createSignal, onMount, onCleanup } from 'solid-js';
import paper from 'paper';
import { Channel, Node, Droplet, Point, FluidType } from '../types';

interface CanvasViewProps {
  channels: Channel[];
  nodes: Node[];
  droplets: Droplet[];
  particles: {
    id: number;
    position: Point;
    velocity: Point;
    size: number;
    color: string;
    phase: FluidType;
  }[];
  isSimulating: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const CHANNEL_COLOR = '#2563eb';
const CHANNEL_STROKE_COLOR = '#1d4ed8';
const JUNCTION_COLOR = '#0ea5e9';
const DROPLET_COLOR = '#60a5fa';
const DROPLET_STROKE_COLOR = '#2563eb';

export default function CanvasView(props: CanvasViewProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  const [isInitialized, setIsInitialized] = createSignal(false);
  let animationFrameId: number | null = null;

  const initPaper = () => {
    if (!canvasRef) return;
    
    paper.setup(canvasRef);
    
    const resizeCanvas = () => {
      if (!canvasRef || !paper.view) return;
      const parent = canvasRef.parentElement;
      if (parent) {
        canvasRef.width = parent.clientWidth;
        canvasRef.height = parent.clientHeight;
        paper.view.viewSize = new paper.Size(parent.clientWidth, parent.clientHeight);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    setIsInitialized(true);
    
    if (props.onCanvasReady) {
      props.onCanvasReady(canvasRef);
    }
    
    onCleanup(() => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    });
  };

  const drawChannels = () => {
    if (!paper.project) return;
    
    const channelLayer = paper.project.layers.find(l => l.name === 'channels');
    if (channelLayer) {
      channelLayer.removeChildren();
    }
    
    const layer = channelLayer || new paper.Layer({ name: 'channels' });
    
    for (const channel of props.channels) {
      const start = new paper.Point(channel.startPoint.x, channel.startPoint.y);
      const end = new paper.Point(channel.endPoint.x, channel.endPoint.y);
      
      const path = new paper.Path({
        segments: [start, end],
        strokeWidth: channel.width,
        strokeColor: new paper.Color(CHANNEL_COLOR),
        strokeCap: 'round',
      });
      
      const border = new paper.Path({
        segments: [start, end],
        strokeWidth: channel.width + 4,
        strokeColor: new paper.Color(CHANNEL_STROKE_COLOR),
        strokeCap: 'round',
      });
      border.sendToBack();
      
      layer.addChild(border);
      layer.addChild(path);
    }
    
    for (const node of props.nodes) {
      const point = new paper.Point(node.point.x, node.point.y);
      
      const junction = new paper.Path.Circle({
        center: point,
        radius: 20,
        fillColor: new paper.Color(JUNCTION_COLOR),
        strokeColor: new paper.Color(CHANNEL_STROKE_COLOR),
        strokeWidth: 2,
      });
      
      layer.addChild(junction);
    }
  };

  const drawDroplets = () => {
    if (!paper.project) return;
    
    const dropletLayer = paper.project.layers.find(l => l.name === 'droplets');
    if (dropletLayer) {
      dropletLayer.removeChildren();
    }
    
    const layer = dropletLayer || new paper.Layer({ name: 'droplets' });
    
    for (const droplet of props.droplets) {
      const center = new paper.Point(droplet.position.x, droplet.position.y);
      
      const dropletCircle = new paper.Path.Circle({
        center: center,
        radius: droplet.radius,
        fillColor: new paper.Color(DROPLET_COLOR),
        strokeColor: new paper.Color(DROPLET_STROKE_COLOR),
        strokeWidth: 2,
        opacity: 0.9,
      });
      
      const highlight = new paper.Path.Circle({
        center: new paper.Point(center.x - droplet.radius * 0.3, center.y - droplet.radius * 0.3),
        radius: droplet.radius * 0.3,
        fillColor: new paper.Color(1, 1, 1, 0.4),
      });
      
      layer.addChild(dropletCircle);
      layer.addChild(highlight);
    }
  };

  const drawParticles = () => {
    if (!paper.project) return;
    
    const particleLayer = paper.project.layers.find(l => l.name === 'particles');
    if (particleLayer) {
      particleLayer.removeChildren();
    }
    
    const layer = particleLayer || new paper.Layer({ name: 'particles' });
    
    for (const particle of props.particles) {
      const center = new paper.Point(particle.position.x, particle.position.y);
      
      const particleCircle = new paper.Path.Circle({
        center: center,
        radius: particle.size / 2,
        fillColor: new paper.Color(particle.color),
        opacity: 0.7,
      });
      
      layer.addChild(particleCircle);
    }
  };

  const drawFlowLines = () => {
    if (!paper.project || !props.isSimulating) return;
    
    const flowLayer = paper.project.layers.find(l => l.name === 'flowlines');
    if (flowLayer) {
      flowLayer.removeChildren();
    }
    
    const layer = flowLayer || new paper.Layer({ name: 'flowlines' });
    
    for (const channel of props.channels) {
      if (channel.flowRate <= 0) continue;
      
      const start = new paper.Point(channel.startPoint.x, channel.startPoint.y);
      const end = new paper.Point(channel.endPoint.x, channel.endPoint.y);
      
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      const arrowSpacing = 40;
      const arrowCount = Math.floor(length / arrowSpacing);
      
      for (let i = 1; i <= arrowCount; i++) {
        const t = i / (arrowCount + 1);
        const x = start.x + dx * t;
        const y = start.y + dy * t;
        
        const arrowSize = 8;
        const angle = Math.atan2(dy, dx);
        
        const arrowTip = new paper.Point(x, y);
        const arrowLeft = new paper.Point(
          x - arrowSize * Math.cos(angle - Math.PI / 6),
          y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        const arrowRight = new paper.Point(
          x - arrowSize * Math.cos(angle + Math.PI / 6),
          y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        
        const arrow = new paper.Path({
          segments: [arrowLeft, arrowTip, arrowRight],
          strokeColor: new paper.Color(1, 1, 1, 0.6),
          strokeWidth: 2,
          strokeCap: 'round',
          strokeJoin: 'round',
        });
        
        layer.addChild(arrow);
      }
    }
  };

  const animate = () => {
    if (!isInitialized()) return;
    
    drawChannels();
    drawParticles();
    drawDroplets();
    drawFlowLines();
    
    paper.view.update();
    
    animationFrameId = requestAnimationFrame(animate);
  };

  onMount(() => {
    initPaper();
    animate();
  });

  return (
    <div class="flex-1 relative bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <canvas
        ref={canvasRef}
        class="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      <div class="absolute top-4 left-4 flex flex-col gap-2">
        <div class="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-gray-200">
          <div class="text-xs text-gray-500 font-medium">状态</div>
          <div class={`text-sm font-semibold ${props.isSimulating ? 'text-green-600' : 'text-gray-500'}`}>
            {props.isSimulating ? '仿真中' : '已暂停'}
          </div>
        </div>
        
        <div class="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-gray-200">
          <div class="text-xs text-gray-500 font-medium">液滴数量</div>
          <div class="text-sm font-semibold text-blue-600">{props.droplets.length}</div>
        </div>
      </div>
      
      <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-md border border-gray-200">
        <div class="text-xs text-gray-500 font-medium mb-2">图例</div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <span class="text-xs text-gray-600">液滴</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span class="text-xs text-gray-600">油相颗粒</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-blue-300"></div>
            <span class="text-xs text-gray-600">水相颗粒</span>
          </div>
        </div>
      </div>
    </div>
  );
}
