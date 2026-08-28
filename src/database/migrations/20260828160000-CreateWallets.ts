import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWallets20260828160000 implements MigrationInterface {
  name = 'CreateWallets20260828160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "wallets_owner_type_enum" AS ENUM ('hub', 'rider')
    `);
    await queryRunner.query(`
      CREATE TYPE "wallet_transactions_type_enum" AS ENUM (
        'hold',
        'release',
        'credit',
        'debit',
        'transfer_in',
        'transfer_out'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_type" "wallets_owner_type_enum" NOT NULL,
        "owner_id" uuid NOT NULL,
        "current_balance" numeric(14,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wallets_owner" UNIQUE ("owner_type", "owner_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_wallets_owner_id" ON "wallets" ("owner_id")
    `);
    await queryRunner.query(`
      CREATE TABLE "wallet_transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "wallet_id" uuid NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "balance_after" numeric(14,2) NOT NULL,
        "type" "wallet_transactions_type_enum" NOT NULL,
        "reference_type" character varying(50),
        "reference_id" uuid,
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallet_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wallet_transactions_wallet_id" FOREIGN KEY ("wallet_id")
          REFERENCES "wallets"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_wallet_transactions_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_transactions_wallet_id_created_at"
        ON "wallet_transactions" ("wallet_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_wallet_transactions_wallet_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "wallet_transactions"`);
    await queryRunner.query(`DROP INDEX "IDX_wallets_owner_id"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TYPE "wallet_transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "wallets_owner_type_enum"`);
  }
}
