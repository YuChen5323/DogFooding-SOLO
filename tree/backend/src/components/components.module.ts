import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Component } from './entities/component.entity';
import { ComponentsService } from './components.service';
import { ComponentsController } from './components.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Component])],
  controllers: [ComponentsController],
  providers: [ComponentsService],
  exports: [ComponentsService],
})
export class ComponentsModule implements OnModuleInit {
  constructor(private readonly componentsService: ComponentsService) {}

  async onModuleInit() {
    await this.componentsService.initializeDefaultComponents();
  }
}
