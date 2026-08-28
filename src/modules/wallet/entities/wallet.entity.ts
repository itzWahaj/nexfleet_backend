import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WalletOwnerType } from './wallet.enums';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'owner_type', type: 'enum', enum: WalletOwnerType })
  ownerType!: WalletOwnerType;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @Column({
    name: 'current_balance',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: '0.00',
  })
  currentBalance!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
