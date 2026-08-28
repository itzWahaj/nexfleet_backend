import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Area } from '../../zones/entities/area.entity';
import { User } from '../../users/entities/user.entity';

@Entity('rider_area_assignments')
export class RiderAreaAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rider_id', type: 'uuid' })
  riderId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rider_id' })
  rider?: User;

  @Column({ name: 'area_id', type: 'uuid' })
  areaId!: string;

  @ManyToOne(() => Area, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt!: Date;
}
