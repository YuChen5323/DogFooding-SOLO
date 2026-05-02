import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ComponentsService } from './components.service';
import { CreateComponentDto } from './dto/create-component.dto';
import { Component, ComponentCategory } from './entities/component.entity';

@Controller('components')
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Post()
  async create(@Body() createComponentDto: CreateComponentDto): Promise<Component> {
    return this.componentsService.create(createComponentDto);
  }

  @Get()
  async findAll(): Promise<Component[]> {
    return this.componentsService.findAll();
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: ComponentCategory): Promise<Component[]> {
    return this.componentsService.findByCategory(category);
  }

  @Get('initialize')
  async initialize(): Promise<Component[]> {
    return this.componentsService.initializeDefaultComponents();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Component> {
    return this.componentsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateComponentDto: Partial<CreateComponentDto>,
  ): Promise<Component> {
    return this.componentsService.update(id, updateComponentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.componentsService.remove(id);
  }
}
