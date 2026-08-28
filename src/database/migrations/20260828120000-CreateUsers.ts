import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers20260828120000 implements MigrationInterface {
  name = 'CreateUsers20260828120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('super_admin', 'hub_admin', 'rider')
    `);
    await queryRunner.query(`
      CREATE TYPE "users_status_enum" AS ENUM ('active', 'inactive', 'suspended')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "phone" character varying(20) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "users_role_enum" NOT NULL,
        "status" "users_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_role" ON "users" ("role")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_role"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_status_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
