import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ErrorCode } from '../../common/errors/error-codes';
import dataSource from '../../database/data-source';
import { Hub } from '../hubs/entities/hub.entity';
import { RiderHubAssignment } from '../riders/entities/rider-hub-assignment.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletOwnerType } from './entities/wallet.enums';
import { WalletService } from './wallet.service';

const TEST_OWNER_ID = '00000000-0000-4000-8000-000000000099';

const describeIntegration =
  process.env.SKIP_INTEGRATION_TESTS === 'true' ? describe.skip : describe;

describeIntegration('WalletService concurrency (integration)', () => {
  let connection: DataSource;
  let walletService: WalletService;
  let walletId: string;

  beforeAll(async () => {
    connection = dataSource.isInitialized
      ? dataSource
      : await dataSource.initialize();

    walletService = new WalletService(
      connection.getRepository(Wallet),
      connection.getRepository(WalletTransaction),
      connection.getRepository(Hub),
      connection.getRepository(RiderHubAssignment),
      connection,
    );
  });

  afterAll(async () => {
    if (connection?.isInitialized) {
      await connection.destroy();
    }
  });

  beforeEach(async () => {
    await connection.query(
      `DELETE FROM wallet_transactions WHERE wallet_id IN (
        SELECT id FROM wallets WHERE owner_id = $1
      )`,
      [TEST_OWNER_ID],
    );
    await connection.query(`DELETE FROM wallets WHERE owner_id = $1`, [
      TEST_OWNER_ID,
    ]);

    const wallet = await walletService.ensureWallet(
      WalletOwnerType.HUB,
      TEST_OWNER_ID,
    );
    walletId = wallet.id;

    await walletService.credit({
      walletId,
      amount: '100.00',
    });
  });

  it('allows only one of two simultaneous debits when balance covers one', async () => {
    const results = await Promise.allSettled([
      walletService.debit({ walletId, amount: '60.00' }),
      walletService.debit({ walletId, amount: '60.00' }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const failure = rejected[0] as PromiseRejectedResult;
    expect(failure.reason).toBeInstanceOf(BadRequestException);
    expect((failure.reason as BadRequestException).getResponse()).toMatchObject(
      {
        code: ErrorCode.INSUFFICIENT_BALANCE,
      },
    );

    const wallet = await connection.getRepository(Wallet).findOneOrFail({
      where: { id: walletId },
    });
    expect(wallet.currentBalance).toBe('40.00');

    const txCount = await connection.getRepository(WalletTransaction).count({
      where: { walletId },
    });
    expect(txCount).toBe(2);
  });
});
