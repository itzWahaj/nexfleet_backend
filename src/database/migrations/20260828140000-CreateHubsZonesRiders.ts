import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHubsZonesRiders20260828140000 implements MigrationInterface {
  name = 'CreateHubsZonesRiders20260828140000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "hubs_owner_type_enum" AS ENUM ('company', 'franchise')
    `);
    await queryRunner.query(`
      CREATE TYPE "hubs_status_enum" AS ENUM ('active', 'inactive')
    `);
    await queryRunner.query(`
      CREATE TYPE "rider_hub_assignments_status_enum" AS ENUM ('active', 'inactive')
    `);

    await queryRunner.query(`
      CREATE TABLE "hubs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "city" character varying(80) NOT NULL,
        "location" geometry(Point, 4326) NOT NULL,
        "owner_type" "hubs_owner_type_enum" NOT NULL,
        "owner_user_id" uuid,
        "status" "hubs_status_enum" NOT NULL DEFAULT 'active',
        CONSTRAINT "PK_hubs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_hubs_owner_user" FOREIGN KEY ("owner_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_hubs_status" ON "hubs" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_hubs_owner_user_id" ON "hubs" ("owner_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_hubs_location" ON "hubs" USING GIST ("location")
    `);

    await queryRunner.query(`
      CREATE TABLE "regions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "city" character varying(80) NOT NULL,
        "name" character varying(120) NOT NULL,
        "boundary" geometry(Polygon, 4326) NOT NULL,
        CONSTRAINT "PK_regions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_regions_city" ON "regions" ("city")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_regions_boundary" ON "regions" USING GIST ("boundary")
    `);

    await queryRunner.query(`
      CREATE TABLE "areas" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "region_id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "boundary" geometry(Polygon, 4326) NOT NULL,
        CONSTRAINT "PK_areas_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_areas_region" FOREIGN KEY ("region_id")
          REFERENCES "regions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_areas_region_id" ON "areas" ("region_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_areas_boundary" ON "areas" USING GIST ("boundary")
    `);

    await queryRunner.query(`
      CREATE TABLE "rider_hub_assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rider_id" uuid NOT NULL,
        "hub_id" uuid NOT NULL,
        "is_home_hub" boolean NOT NULL DEFAULT false,
        "status" "rider_hub_assignments_status_enum" NOT NULL DEFAULT 'active',
        CONSTRAINT "PK_rider_hub_assignments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rider_hub_assignments_rider" FOREIGN KEY ("rider_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_rider_hub_assignments_hub" FOREIGN KEY ("hub_id")
          REFERENCES "hubs"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_rider_hub_assignments_rider_hub" UNIQUE ("rider_id", "hub_id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_rider_hub_assignments_hub_id" ON "rider_hub_assignments" ("hub_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "rider_area_assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "rider_id" uuid NOT NULL,
        "area_id" uuid NOT NULL,
        "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rider_area_assignments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rider_area_assignments_rider" FOREIGN KEY ("rider_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_rider_area_assignments_area" FOREIGN KEY ("area_id")
          REFERENCES "areas"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_rider_area_assignments_rider_area" UNIQUE ("rider_id", "area_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rider_area_assignments"`);
    await queryRunner.query(`DROP TABLE "rider_hub_assignments"`);
    await queryRunner.query(`DROP TABLE "areas"`);
    await queryRunner.query(`DROP TABLE "regions"`);
    await queryRunner.query(`DROP TABLE "hubs"`);
    await queryRunner.query(`DROP TYPE "rider_hub_assignments_status_enum"`);
    await queryRunner.query(`DROP TYPE "hubs_status_enum"`);
    await queryRunner.query(`DROP TYPE "hubs_owner_type_enum"`);
  }
}
