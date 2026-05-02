import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Component, ComponentCategory } from './entities/component.entity';
import { CreateComponentDto } from './dto/create-component.dto';

@Injectable()
export class ComponentsService {
  constructor(
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
  ) {}

  async create(createComponentDto: CreateComponentDto): Promise<Component> {
    const component = this.componentRepository.create(createComponentDto);
    return this.componentRepository.save(component);
  }

  async findAll(): Promise<Component[]> {
    return this.componentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByCategory(category: ComponentCategory): Promise<Component[]> {
    return this.componentRepository.find({
      where: { category },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Component> {
    const component = await this.componentRepository.findOne({
      where: { id },
    });
    
    if (!component) {
      throw new NotFoundException(`构件 ${id} 不存在`);
    }
    
    return component;
  }

  async update(id: string, updateComponentDto: Partial<CreateComponentDto>): Promise<Component> {
    const component = await this.findOne(id);
    Object.assign(component, updateComponentDto);
    return this.componentRepository.save(component);
  }

  async remove(id: string): Promise<void> {
    const component = await this.findOne(id);
    await this.componentRepository.remove(component);
  }

  async initializeDefaultComponents(): Promise<Component[]> {
    const defaultComponents: CreateComponentDto[] = [
      {
        type: 'zhu',
        name: 'Column',
        chineseName: '柱',
        category: 'column',
        description: '垂直承重构件，支撑梁架',
        defaultDimensions: { width: 0.5, height: 2.5, depth: 0.5 },
        caiFenRequirements: {
          grade: '三等材',
          widthFen: 10,
          heightFen: 50,
          depthFen: 10,
        },
        compatibleMortises: ['tou-sun', 'ban-sun'],
      },
      {
        type: 'liang',
        name: 'Beam',
        chineseName: '梁',
        category: 'beam',
        description: '水平承重构件，承受屋面荷载',
        defaultDimensions: { width: 3.0, height: 0.5, depth: 0.5 },
        caiFenRequirements: {
          grade: '三等材',
          widthFen: 60,
          heightFen: 10,
          depthFen: 10,
        },
        compatibleMortises: ['ban-sun', 'tou-sun'],
      },
      {
        type: 'lin',
        name: 'Purlin',
        chineseName: '檩',
        category: 'beam',
        description: '沿开间方向的水平构件',
        defaultDimensions: { width: 2.5, height: 0.3, depth: 0.3 },
        caiFenRequirements: {
          grade: '三等材',
          widthFen: 50,
          heightFen: 6,
          depthFen: 6,
        },
        compatibleMortises: ['ban-sun'],
      },
      {
        type: 'fang',
        name: 'Fang',
        chineseName: '枋',
        category: 'beam',
        description: '连接构件，增强结构整体性',
        defaultDimensions: { width: 2.0, height: 0.25, depth: 0.25 },
        caiFenRequirements: {
          grade: '三等材',
          widthFen: 40,
          heightFen: 5,
          depthFen: 5,
        },
        compatibleMortises: ['ban-sun', 'tou-sun'],
      },
      {
        type: 'dou',
        name: 'Dou',
        chineseName: '斗',
        category: 'bracket',
        description: '斗拱的基座构件',
        defaultDimensions: { width: 0.3, height: 0.15, depth: 0.3 },
        caiFenRequirements: {
          grade: '三等材',
          widthFen: 6,
          heightFen: 3,
          depthFen: 6,
        },
        compatibleMortises: [],
      },
      {
        type: 'gong',
        name: 'Gong',
        chineseName: '拱',
        category: 'bracket',
        description: '斗拱的水平悬挑构件',
        defaultDimensions: { width: 0.6, height: 0.12, depth: 0.15 },
        caiFenRequirements: {
          grade: '三等材',
          widthFen: 12,
          heightFen: 2.4,
          depthFen: 3,
        },
        compatibleMortises: [],
      },
      {
        type: 'ang',
        name: 'Ang',
        chineseName: '昂',
        category: 'bracket',
        description: '斗拱的斜向悬挑构件',
        defaultDimensions: { width: 0.5, height: 0.12, depth: 0.8 },
        caiFenRequirements: {
          grade: '三等材',
          widthFen: 10,
          heightFen: 2.4,
          depthFen: 16,
        },
        compatibleMortises: [],
      },
    ];

    const existingComponents = await this.componentRepository.find();
    
    if (existingComponents.length > 0) {
      return existingComponents;
    }

    const components = this.componentRepository.create(defaultComponents);
    return this.componentRepository.save(components);
  }
}
