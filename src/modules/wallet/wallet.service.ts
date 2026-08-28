import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ErrorCode } from '../../common/errors/error-codes';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { HubScope } from '../../common/types/auth';
import {
  addMoney,
  formatMoney,
  hasSufficientBalance,
  isPositiveMoney,
  subtractMoney,
} from '../../common/utils/money.util';
import { assertHubInScope } from '../../common/utils/hub-scope.util';
import { Hub } from '../hubs/entities/hub.entity';
import { RiderHubAssignment } from '../riders/entities/rider-hub-assignment.entity';
import {
  TopUpWalletResponseDto,
  WalletResponseDto,
  WalletTransactionResponseDto,
} from './dto/wallet.dto';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { Wallet } from './entities/wallet.entity';
import {
  WalletOwnerType,
  WalletReferenceType,
  WalletTransactionType,
} from './entities/wallet.enums';

export interface WalletMutationOptions {
  walletId: string;
  amount: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdBy?: string | null;
  manager?: EntityManager;
}

export interface WalletTransferOptions {
  fromWalletId: string;
  toWalletId: string;
  amount: string;
  referenceType?: string | null;
  referenceId?: string | null;
  createdBy?: string | null;
  manager?: EntityManager;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionsRepository: Repository<WalletTransaction>,
    @InjectRepository(Hub)
    private readonly hubsRepository: Repository<Hub>,
    @InjectRepository(RiderHubAssignment)
    private readonly riderHubRepository: Repository<RiderHubAssignment>,
    private readonly dataSource: DataSource,
  ) {}

  async ensureWallet(
    ownerType: WalletOwnerType,
    ownerId: string,
    manager?: EntityManager,
  ): Promise<Wallet> {
    const repo = manager
      ? manager.getRepository(Wallet)
      : this.walletsRepository;

    const existing = await repo.findOne({
      where: { ownerType, ownerId },
    });
    if (existing) {
      return existing;
    }

    try {
      const created = repo.create({
        ownerType,
        ownerId,
        currentBalance: formatMoney(0),
      });
      return await repo.save(created);
    } catch {
      const wallet = await repo.findOne({
        where: { ownerType, ownerId },
      });
      if (!wallet) {
        throw new NotFoundException('Wallet could not be created');
      }
      return wallet;
    }
  }

  async findById(
    walletId: string,
    hubScope: HubScope | null,
  ): Promise<WalletResponseDto> {
    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    await this.assertWalletAccess(wallet, hubScope);
    return this.toWalletResponse(wallet);
  }

  async findByOwner(
    ownerType: WalletOwnerType,
    ownerId: string,
    hubScope: HubScope | null,
  ): Promise<WalletResponseDto> {
    await this.assertOwnerExists(ownerType, ownerId, hubScope);
    const wallet = await this.ensureWallet(ownerType, ownerId);
    await this.assertWalletAccess(wallet, hubScope);
    return this.toWalletResponse(wallet);
  }

  async listTransactions(
    walletId: string,
    page: number,
    limit: number,
    hubScope: HubScope | null,
  ): Promise<PaginatedResult<WalletTransactionResponseDto>> {
    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    await this.assertWalletAccess(wallet, hubScope);

    const [rows, total] = await this.transactionsRepository.findAndCount({
      where: { walletId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(
      rows.map((row) => this.toTransactionResponse(row)),
      total,
      page,
      limit,
    );
  }

  async topUpHubWallet(
    walletId: string,
    amount: string,
    createdBy: string,
    hubScope: HubScope | null,
  ): Promise<TopUpWalletResponseDto> {
    const wallet = await this.getWalletOrThrow(walletId);
    if (wallet.ownerType !== WalletOwnerType.HUB) {
      throw new BadRequestException(
        'Top-up credit applies to hub wallets only',
      );
    }
    await this.assertWalletAccess(wallet, hubScope);

    const transaction = await this.credit({
      walletId,
      amount,
      referenceType: WalletReferenceType.TOP_UP,
      createdBy,
    });

    const updated = await this.walletsRepository.findOneOrFail({
      where: { id: walletId },
    });

    return {
      wallet: this.toWalletResponse(updated),
      transaction: this.toTransactionResponse(transaction),
      hubDebitTransaction: null,
    };
  }

  async topUpRiderWallet(
    riderWalletId: string,
    amount: string,
    createdBy: string,
    hubScope: HubScope | null,
    hubId?: string,
  ): Promise<TopUpWalletResponseDto> {
    if (hubScope === null || hubScope === undefined) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Hub admin scope required to top up rider wallets',
      });
    }

    const riderWallet = await this.getWalletOrThrow(riderWalletId);
    if (riderWallet.ownerType !== WalletOwnerType.RIDER) {
      throw new BadRequestException(
        'Rider top-up applies to rider wallets only',
      );
    }
    await this.assertWalletAccess(riderWallet, hubScope);

    const assignments = await this.riderHubRepository
      .createQueryBuilder('rha')
      .where('rha.rider_id = :riderId', { riderId: riderWallet.ownerId })
      .andWhere('rha.hub_id IN (:...hubIds)', { hubIds: hubScope.hubIds })
      .getMany();

    if (assignments.length === 0) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN_HUB_SCOPE,
        message: 'Rider is not assigned to your hub',
      });
    }

    let sourceHubId: string;
    if (hubId) {
      assertHubInScope(hubId, hubScope);
      if (!assignments.some((row) => row.hubId === hubId)) {
        throw new BadRequestException(
          'Rider is not assigned to the specified hub',
        );
      }
      sourceHubId = hubId;
    } else if (assignments.length === 1) {
      sourceHubId = assignments[0]!.hubId;
    } else {
      throw new BadRequestException(
        'hubId is required when the rider has multiple hub assignments in scope',
      );
    }

    const hubWallet = await this.ensureWallet(WalletOwnerType.HUB, sourceHubId);

    const transferResult = await this.transfer({
      fromWalletId: hubWallet.id,
      toWalletId: riderWallet.id,
      amount,
      referenceType: WalletReferenceType.TOP_UP,
      createdBy,
    });

    const updatedRiderWallet = await this.walletsRepository.findOneOrFail({
      where: { id: riderWalletId },
    });

    return {
      wallet: this.toWalletResponse(updatedRiderWallet),
      transaction: this.toTransactionResponse(transferResult.to),
      hubDebitTransaction: this.toTransactionResponse(transferResult.from),
    };
  }

  async credit(options: WalletMutationOptions): Promise<WalletTransaction> {
    return this.applyBalanceChange({
      ...options,
      type: WalletTransactionType.CREDIT,
      delta: options.amount,
    });
  }

  async debit(options: WalletMutationOptions): Promise<WalletTransaction> {
    return this.applyBalanceChange({
      ...options,
      type: WalletTransactionType.DEBIT,
      delta: formatMoney(-Number(options.amount)),
      debitAmount: options.amount,
    });
  }

  async hold(options: WalletMutationOptions): Promise<WalletTransaction> {
    return this.applyBalanceChange({
      ...options,
      type: WalletTransactionType.HOLD,
      delta: formatMoney(-Number(options.amount)),
      debitAmount: options.amount,
    });
  }

  async release(options: WalletMutationOptions): Promise<WalletTransaction> {
    return this.applyBalanceChange({
      ...options,
      type: WalletTransactionType.RELEASE,
      delta: options.amount,
    });
  }

  async transfer(
    options: WalletTransferOptions,
  ): Promise<{ from: WalletTransaction; to: WalletTransaction }> {
    this.assertPositiveAmount(options.amount);

    if (options.fromWalletId === options.toWalletId) {
      throw new BadRequestException('Cannot transfer to the same wallet');
    }

    const run = async (manager: EntityManager) => {
      const [firstId, secondId] = [
        options.fromWalletId,
        options.toWalletId,
      ].sort();

      await this.lockWallet(firstId, manager);
      await this.lockWallet(secondId, manager);

      const fromWallet = await manager.findOne(Wallet, {
        where: { id: options.fromWalletId },
      });
      const toWallet = await manager.findOne(Wallet, {
        where: { id: options.toWalletId },
      });

      if (!fromWallet || !toWallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (!hasSufficientBalance(fromWallet.currentBalance, options.amount)) {
        throw new BadRequestException({
          code: ErrorCode.INSUFFICIENT_BALANCE,
          message: 'Insufficient wallet balance',
        });
      }

      const fromBalanceAfter = subtractMoney(
        fromWallet.currentBalance,
        options.amount,
      );
      const toBalanceAfter = addMoney(toWallet.currentBalance, options.amount);
      const signedAmount = formatMoney(-Number(options.amount));

      await manager.update(
        Wallet,
        { id: fromWallet.id },
        { currentBalance: fromBalanceAfter },
      );
      await manager.update(
        Wallet,
        { id: toWallet.id },
        { currentBalance: toBalanceAfter },
      );

      const fromTx = await this.insertTransaction(manager, {
        walletId: fromWallet.id,
        amount: signedAmount,
        balanceAfter: fromBalanceAfter,
        type: WalletTransactionType.TRANSFER_OUT,
        referenceType: options.referenceType ?? null,
        referenceId: options.referenceId ?? null,
        createdBy: options.createdBy ?? null,
      });

      const toTx = await this.insertTransaction(manager, {
        walletId: toWallet.id,
        amount: options.amount,
        balanceAfter: toBalanceAfter,
        type: WalletTransactionType.TRANSFER_IN,
        referenceType: options.referenceType ?? null,
        referenceId: options.referenceId ?? null,
        createdBy: options.createdBy ?? null,
      });

      return { from: fromTx, to: toTx };
    };

    if (options.manager) {
      return run(options.manager);
    }

    return this.dataSource.transaction(run);
  }

  private async applyBalanceChange(params: {
    walletId: string;
    amount: string;
    type: WalletTransactionType;
    delta: string;
    debitAmount?: string;
    referenceType?: string | null;
    referenceId?: string | null;
    createdBy?: string | null;
    manager?: EntityManager;
  }): Promise<WalletTransaction> {
    this.assertPositiveAmount(params.amount);

    const run = async (manager: EntityManager) => {
      const wallet = await this.lockWallet(params.walletId, manager);

      if (
        params.debitAmount !== undefined &&
        !hasSufficientBalance(wallet.currentBalance, params.debitAmount)
      ) {
        throw new BadRequestException({
          code: ErrorCode.INSUFFICIENT_BALANCE,
          message: 'Insufficient wallet balance',
        });
      }

      const balanceAfter = addMoney(wallet.currentBalance, params.delta);

      await manager.update(
        Wallet,
        { id: wallet.id },
        { currentBalance: balanceAfter },
      );

      return this.insertTransaction(manager, {
        walletId: wallet.id,
        amount: params.delta,
        balanceAfter,
        type: params.type,
        referenceType: params.referenceType ?? null,
        referenceId: params.referenceId ?? null,
        createdBy: params.createdBy ?? null,
      });
    };

    if (params.manager) {
      return run(params.manager);
    }

    return this.dataSource.transaction(run);
  }

  private async lockWallet(
    walletId: string,
    manager: EntityManager,
  ): Promise<Wallet> {
    const wallet = await manager
      .createQueryBuilder(Wallet, 'wallet')
      .setLock('pessimistic_write')
      .where('wallet.id = :walletId', { walletId })
      .getOne();

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  private async insertTransaction(
    manager: EntityManager,
    params: {
      walletId: string;
      amount: string;
      balanceAfter: string;
      type: WalletTransactionType;
      referenceType: string | null;
      referenceId: string | null;
      createdBy: string | null;
    },
  ): Promise<WalletTransaction> {
    const repo = manager.getRepository(WalletTransaction);
    const row = repo.create({
      walletId: params.walletId,
      amount: formatMoney(params.amount),
      balanceAfter: formatMoney(params.balanceAfter),
      type: params.type,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      createdBy: params.createdBy,
    });
    return repo.save(row);
  }

  private assertPositiveAmount(amount: string): void {
    if (!isPositiveMoney(amount)) {
      throw new BadRequestException('Amount must be greater than zero');
    }
  }

  private async getWalletOrThrow(walletId: string): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  private async assertOwnerExists(
    ownerType: WalletOwnerType,
    ownerId: string,
    hubScope: HubScope | null,
  ): Promise<void> {
    if (ownerType === WalletOwnerType.HUB) {
      const hub = await this.hubsRepository.findOne({ where: { id: ownerId } });
      if (!hub) {
        throw new NotFoundException('Hub not found');
      }
      assertHubInScope(ownerId, hubScope);
      return;
    }

    const assignment = await this.riderHubRepository.findOne({
      where: { riderId: ownerId },
    });
    if (!assignment) {
      throw new NotFoundException('Rider not found');
    }

    if (hubScope !== null && hubScope !== undefined) {
      assertHubInScope(assignment.hubId, hubScope);
    }
  }

  private async assertWalletAccess(
    wallet: Wallet,
    hubScope: HubScope | null,
  ): Promise<void> {
    if (hubScope === null || hubScope === undefined) {
      return;
    }

    if (wallet.ownerType === WalletOwnerType.HUB) {
      assertHubInScope(wallet.ownerId, hubScope);
      return;
    }

    const assignment = await this.riderHubRepository
      .createQueryBuilder('rha')
      .where('rha.rider_id = :riderId', { riderId: wallet.ownerId })
      .andWhere('rha.hub_id IN (:...hubIds)', { hubIds: hubScope.hubIds })
      .getOne();

    if (!assignment) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN_HUB_SCOPE,
        message: 'Wallet is outside your hub scope',
      });
    }
  }

  private toWalletResponse(wallet: Wallet): WalletResponseDto {
    return {
      id: wallet.id,
      ownerType: wallet.ownerType,
      ownerId: wallet.ownerId,
      currentBalance: formatMoney(wallet.currentBalance),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  private toTransactionResponse(
    transaction: WalletTransaction,
  ): WalletTransactionResponseDto {
    return {
      id: transaction.id,
      walletId: transaction.walletId,
      amount: formatMoney(transaction.amount),
      balanceAfter: formatMoney(transaction.balanceAfter),
      type: transaction.type,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId,
      createdBy: transaction.createdBy,
      createdAt: transaction.createdAt,
    };
  }
}
