import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Region } from './region.entity';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'region_id', type: 'uuid' })
  regionId!: string;

  @ManyToOne(() => Region, (region) => region.areas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'region_id' })
  region?: Region;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  boundary!: string;
}
