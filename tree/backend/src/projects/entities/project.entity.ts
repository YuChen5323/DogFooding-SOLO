import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TimberGrade } from '../../components/entities/component.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['一等材', '二等材', '三等材', '四等材', '五等材', '六等材', '七等材', '八等材'],
    default: '三等材',
  })
  timberGrade: TimberGrade;

  @Column({ type: 'jsonb', nullable: true })
  components: Array<{
    type: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    customDimensions?: { width: number; height: number; depth: number };
  }>;

  @Column({ type: 'jsonb', nullable: true })
  joints: Array<{
    id: string;
    componentA: string;
    componentB: string;
    type: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    showGrid: boolean;
    showLabels: boolean;
    showDimensions: boolean;
    scale: number;
  };

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
