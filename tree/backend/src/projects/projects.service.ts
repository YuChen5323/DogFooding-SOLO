import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      timberGrade: createProjectDto.timberGrade || '三等材',
    });
    return this.projectRepository.save(project);
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
    });
    
    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }
    
    return project;
  }

  async update(id: string, updateProjectDto: Partial<CreateProjectDto>): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }

  async exportSVG(
    projectId: string,
    viewType: 'front' | 'side' | 'top' | 'isometric' = 'front',
    options?: {
      showLabels?: boolean;
      showDimensions?: boolean;
      showGrid?: boolean;
      scale?: number;
    },
  ): Promise<string> {
    const project = await this.findOne(projectId);
    
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseScale = (options?.scale || 100) / 100 * 30;
    
    const viewNames = {
      front: '正立面图',
      side: '侧立面图',
      top: '平面图',
      isometric: '轴测图',
    };

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .title { font-family: 'Noto Serif SC', serif; font-size: 24px; font-weight: bold; }
      .subtitle { font-family: 'Noto Serif SC', serif; font-size: 14px; fill: #8b5a2b; }
      .component { stroke: #65341e; stroke-width: 1.5; fill: #e4b887; fill-opacity: 0.6; }
      .component-outline { stroke: #65341e; stroke-width: 2; fill: none; }
      .label-text { font-family: 'Noto Serif SC', serif; font-size: 12px; fill: #361a0e; }
      .dimension-line { stroke: #8b5a2b; stroke-width: 1; }
      .dimension-text { font-family: sans-serif; font-size: 10px; fill: #8b5a2b; }
      .grid-line { stroke: #d4d3c3; stroke-width: 0.5; stroke-dasharray: 4,4; }
      .leader-line { stroke: #65341e; stroke-width: 0.8; }
    </style>
  </defs>
  
  <rect width="${width}" height="${height}" fill="#fdf8f3"/>
  
  <text x="${centerX}" y="40" text-anchor="middle" class="title">中国古建筑木构架构造图</text>
  <text x="${centerX}" y="60" text-anchor="middle" class="subtitle">${viewNames[viewType]} · 项目: ${project.name} · 材份: ${project.timberGrade}</text>
`;

    if (options?.showGrid) {
      for (let x = 0; x <= width; x += 50) {
        svgContent += `<line x1="${x}" y1="80" x2="${x}" y2="${height - 40}" class="grid-line"/>`;
      }
      for (let y = 80; y <= height - 40; y += 50) {
        svgContent += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" class="grid-line"/>`;
      }
    }

    if (project.components && project.components.length > 0) {
      project.components.forEach((comp, index) => {
        const projectX = (comp.position?.x || 0) * baseScale;
        const projectY = -(comp.position?.y || 0) * baseScale;
        
        const rectX = centerX + projectX - 50;
        const rectY = centerY + projectY - 100;
        const rectW = 100;
        const rectH = 200;
        
        svgContent += `
  <rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" class="component"/>
  <rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" class="component-outline"/>`;
        
        if (options?.showLabels) {
          const labelX = rectX + rectW + 15;
          const labelY = rectY + rectH / 2;
          
          svgContent += `
  <line x1="${rectX + rectW}" y1="${labelY}" x2="${labelX}" y2="${labelY}" class="leader-line"/>
  <text x="${labelX + 5}" y="${labelY + 4}" class="label-text">构件 ${index + 1}</text>`;
        }
      });
    } else {
      svgContent += `
  <text x="${centerX}" y="${centerY}" text-anchor="middle" fill="#999" font-size="14">该项目暂无构件数据</text>`;
    }

    if (options?.showDimensions) {
      svgContent += `
  <text x="20" y="${height - 20}" class="dimension-text">注: 图中尺寸单位为米，已按材份制换算</text>`;
    }

    svgContent += `
</svg>`;

    return svgContent;
  }
}
