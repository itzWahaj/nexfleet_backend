import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Area } from './area.entity';

@Entity('regions')
export class Region {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80 })
  city!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  boundary!: string;

  @OneToMany(() => Area, (area) => area.region)
  areas?: Area[];
}
