import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { HubOwnerType, HubStatus } from './hub.enums';

@Entity('hubs')
export class Hub {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  city!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: string;

  @Column({ name: 'owner_type', type: 'enum', enum: HubOwnerType })
  ownerType!: HubOwnerType;

  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser?: User | null;

  @Column({ type: 'enum', enum: HubStatus, default: HubStatus.ACTIVE })
  status!: HubStatus;
}
