import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Hub } from '../../hubs/entities/hub.entity';
import { User } from '../../users/entities/user.entity';
import { RiderHubAssignmentStatus } from './rider.enums';

@Entity('rider_hub_assignments')
export class RiderHubAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'rider_id', type: 'uuid' })
  riderId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rider_id' })
  rider?: User;

  @Column({ name: 'hub_id', type: 'uuid' })
  hubId!: string;

  @ManyToOne(() => Hub, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hub_id' })
  hub?: Hub;

  @Column({ name: 'is_home_hub', type: 'boolean', default: false })
  isHomeHub!: boolean;

  @Column({
    type: 'enum',
    enum: RiderHubAssignmentStatus,
    default: RiderHubAssignmentStatus.ACTIVE,
  })
  status!: RiderHubAssignmentStatus;
}
