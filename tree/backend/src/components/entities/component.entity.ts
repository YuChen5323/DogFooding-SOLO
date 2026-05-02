import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ComponentCategory = 'column' | 'beam' | 'bracket' | 'other';
export type TimberGrade = '一等材' | '二等材' | '三等材' | '四等材' | '五等材' | '六等材' | '七等材' | '八等材';

@Entity('components')
export class Component {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  chineseName: string;

  @Column({
    type: 'enum',
    enum: ['column', 'beam', 'bracket', 'other'],
    default: 'other',
  })
  category: ComponentCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  defaultDimensions: {
    width: number;
    height: number;
    depth: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  caiFenRequirements: {
    grade: TimberGrade;
    widthFen: number;
    heightFen: number;
    depthFen: number;
  };

  @Column({ type: 'simple-array', nullable: true })
  compatibleMortises: string[];

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
