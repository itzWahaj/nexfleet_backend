import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ErrorCode } from '../../common/errors/error-codes';
import { Hub } from '../hubs/entities/hub.entity';
import { RiderHubAssignment } from '../riders/entities/rider-hub-assignment.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { Wallet } from './entities/wallet.entity';
import {
  WalletReferenceType,
  WalletTransactionType,
} from './entities/wallet.enums';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  const walletsRepository = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<Wallet>;

  const transactionsRepository = {
    findAndCount: jest.fn(),
  } as unknown as Repository<WalletTransaction>;

  const hubsRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<Hub>;

  const riderHubRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as Repository<RiderHubAssignment>;

  const dataSource = {
    transaction: jest.fn(),
  } as unknown as DataSource;

  const service = new WalletService(
    walletsRepository,
    transactionsRepository,
    hubsRepository,
    riderHubRepository,
    dataSource,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('credit updates balance and inserts a transaction in one DB transaction', async () => {
    const manager = createManager({
      currentBalance: '100.00',
      walletId: 'wallet-1',
    });
    (dataSource.transaction as jest.Mock).mockImplementation(
      (fn: (m: EntityManager) => Promise<unknown>) => fn(manager),
    );

    const tx = await service.credit({
      walletId: 'wallet-1',
      amount: '25.50',
      referenceType: WalletReferenceType.TOP_UP,
      createdBy: 'user-1',
    });

    expect(manager.update).toHaveBeenCalledWith(
      Wallet,
      { id: 'wallet-1' },
      { currentBalance: '125.50' },
    );
    expect(tx.type).toBe(WalletTransactionType.CREDIT);
    expect(tx.amount).toBe('25.50');
    expect(tx.balanceAfter).toBe('125.50');
  });

  it('debit throws INSUFFICIENT_BALANCE when balance is too low', async () => {
    const manager = createManager({
      currentBalance: '40.00',
      walletId: 'wallet-1',
    });
    (dataSource.transaction as jest.Mock).mockImplementation(
      (fn: (m: EntityManager) => Promise<unknown>) => fn(manager),
    );

    await expect(
      service.debit({ walletId: 'wallet-1', amount: '60.00' }),
    ).rejects.toMatchObject({
      response: {
        code: ErrorCode.INSUFFICIENT_BALANCE,
      },
    });
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('hold reduces available balance like a debit', async () => {
    const manager = createManager({
      currentBalance: '100.00',
      walletId: 'wallet-1',
    });
    (dataSource.transaction as jest.Mock).mockImplementation(
      (fn: (m: EntityManager) => Promise<unknown>) => fn(manager),
    );

    const tx = await service.hold({
      walletId: 'wallet-1',
      amount: '30.00',
      referenceType: WalletReferenceType.ORDER,
      referenceId: 'order-1',
    });

    expect(manager.update).toHaveBeenCalledWith(
      Wallet,
      { id: 'wallet-1' },
      { currentBalance: '70.00' },
    );
    expect(tx.type).toBe(WalletTransactionType.HOLD);
    expect(tx.amount).toBe('-30.00');
  });

  it('release increases available balance like a credit', async () => {
    const manager = createManager({
      currentBalance: '70.00',
      walletId: 'wallet-1',
    });
    (dataSource.transaction as jest.Mock).mockImplementation(
      (fn: (m: EntityManager) => Promise<unknown>) => fn(manager),
    );

    const tx = await service.release({
      walletId: 'wallet-1',
      amount: '30.00',
      referenceType: WalletReferenceType.ORDER,
      referenceId: 'order-1',
    });

    expect(tx.type).toBe(WalletTransactionType.RELEASE);
    expect(tx.balanceAfter).toBe('100.00');
  });

  it('transfer locks wallets in sorted order and writes both ledger rows', async () => {
    const manager = createTransferManager();
    (dataSource.transaction as jest.Mock).mockImplementation(
      (fn: (m: EntityManager) => Promise<unknown>) => fn(manager),
    );

    const result = await service.transfer({
      fromWalletId: 'wallet-b',
      toWalletId: 'wallet-a',
      amount: '50.00',
      referenceType: WalletReferenceType.TOP_UP,
      createdBy: 'admin-1',
    });

    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(2);
    expect(result.from.type).toBe(WalletTransactionType.TRANSFER_OUT);
    expect(result.to.type).toBe(WalletTransactionType.TRANSFER_IN);
    expect(result.from.amount).toBe('-50.00');
    expect(result.to.amount).toBe('50.00');
  });

  it('findById throws when wallet does not exist', async () => {
    (walletsRepository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findById('missing', null)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects non-positive amounts', async () => {
    await expect(
      service.credit({ walletId: 'wallet-1', amount: '0.00' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  function createManager(params: {
    currentBalance: string;
    walletId: string;
  }): EntityManager {
    const txRepo = {
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => ({ id: 'tx-1', ...row })),
    };

    const qb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({
        id: params.walletId,
        currentBalance: params.currentBalance,
      }),
    };

    return {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      update: jest.fn(),
      getRepository: jest.fn().mockReturnValue(txRepo),
      findOne: jest.fn(),
    } as unknown as EntityManager;
  }

  function createTransferManager(): EntityManager {
    const wallets = new Map([
      ['wallet-a', { id: 'wallet-a', currentBalance: '200.00' }],
      ['wallet-b', { id: 'wallet-b', currentBalance: '100.00' }],
    ]);

    const txRepo = {
      create: jest.fn((row) => row),
      save: jest.fn(async (row) => ({ id: `tx-${row.type}`, ...row })),
    };

    const qb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(function (this: {
        where: jest.Mock;
      }) {
        const walletId = this.where.mock.calls.at(-1)?.[1]?.walletId as string;
        return Promise.resolve(wallets.get(walletId) ?? null);
      }),
    };

    return {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      update: jest.fn().mockImplementation((_entity, criteria, values) => {
        const wallet = wallets.get(criteria.id as string);
        if (wallet && values.currentBalance) {
          wallet.currentBalance = values.currentBalance as string;
        }
        return Promise.resolve(undefined);
      }),
      getRepository: jest.fn().mockReturnValue(txRepo),
      findOne: jest.fn().mockImplementation((_entity, options) => {
        const id = options.where.id as string;
        return Promise.resolve(wallets.get(id) ?? null);
      }),
    } as unknown as EntityManager;
  }
});
