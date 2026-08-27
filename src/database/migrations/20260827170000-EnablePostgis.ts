import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePostgis20260827170000 implements MigrationInterface {
  name = 'EnablePostgis20260827170000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS "postgis"`);
  }
}
