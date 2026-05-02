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
  Query,
  Header,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './entities/project.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  async findAll(): Promise<Project[]> {
    return this.projectsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: Partial<CreateProjectDto>,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.projectsService.remove(id);
  }

  @Get(':id/export/:viewType')
  @Header('Content-Type', 'image/svg+xml')
  @Header('Content-Disposition', 'attachment; filename="construction-drawing.svg"')
  async exportSVG(
    @Param('id') id: string,
    @Param('viewType') viewType: 'front' | 'side' | 'top' | 'isometric',
    @Query('showLabels') showLabels: boolean = true,
    @Query('showDimensions') showDimensions: boolean = true,
    @Query('showGrid') showGrid: boolean = false,
    @Query('scale') scale: number = 100,
  ): Promise<string> {
    return this.projectsService.exportSVG(id, viewType, {
      showLabels,
      showDimensions,
      showGrid,
      scale,
    });
  }
}
