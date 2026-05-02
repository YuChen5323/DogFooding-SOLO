import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FossilService } from '../services/fossil.service';
import { Fossil } from '../schemas/fossil.schema';

@Controller('fossils')
export class FossilController {
  constructor(private readonly fossilService: FossilService) {}

  @Get()
  async findAll(): Promise<Fossil[]> {
    return this.fossilService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Fossil> {
    return this.fossilService.findById(id);
  }

  @Post()
  async create(@Body() fossilData: Partial<Fossil>): Promise<Fossil> {
    return this.fossilService.create(fossilData);
  }

  @Post('init')
  async initialize(): Promise<void> {
    return this.fossilService.initializeDefaultFossils();
  }
}
