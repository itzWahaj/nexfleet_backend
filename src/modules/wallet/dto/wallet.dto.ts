import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';
import { MONEY_AMOUNT_REGEX } from '../../../common/utils/money.util';
import {
  WalletOwnerType,
  WalletReferenceType,
  WalletTransactionType,
} from '../entities/wallet.enums';

export class WalletResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: WalletOwnerType })
  ownerType!: WalletOwnerType;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty({ example: '1250.00' })
  currentBalance!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class WalletTransactionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  walletId!: string;

  @ApiProperty({ example: '-500.00' })
  amount!: string;

  @ApiProperty({ example: '750.00' })
  balanceAfter!: string;

  @ApiProperty({ enum: WalletTransactionType })
  type!: WalletTransactionType;

  @ApiPropertyOptional({ enum: WalletReferenceType, nullable: true })
  referenceType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  referenceId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class PaginatedWalletTransactionsResponseDto {
  @ApiProperty({ type: [WalletTransactionResponseDto] })
  items!: WalletTransactionResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

export class TopUpWalletDto {
  @ApiProperty({ example: '5000.00' })
  @Matches(MONEY_AMOUNT_REGEX, {
    message: 'amount must be a positive number with up to 2 decimal places',
  })
  amount!: string;

  @ApiPropertyOptional({
    description:
      'Hub to debit when topping up a rider (required if rider has multiple hub assignments in scope)',
  })
  @IsOptional()
  @IsUUID()
  hubId?: string;
}

export class TopUpWalletResponseDto {
  @ApiProperty({ type: WalletResponseDto })
  wallet!: WalletResponseDto;

  @ApiProperty({ type: WalletTransactionResponseDto })
  transaction!: WalletTransactionResponseDto;

  @ApiPropertyOptional({ type: WalletTransactionResponseDto, nullable: true })
  hubDebitTransaction!: WalletTransactionResponseDto | null;
}
