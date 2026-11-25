import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccessRequests1795564800001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "access_requests" (
        "id" uuid CONSTRAINT "PK_access_requests" PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL CONSTRAINT "FK_access_requests_company_id" REFERENCES "companies" ("id") ON DELETE RESTRICT,
        "user_id" uuid NOT NULL CONSTRAINT "FK_access_requests_user_id" REFERENCES "users" ("id") ON DELETE RESTRICT,
        "module" varchar(20) NOT NULL,
        "status" varchar(10) NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_access_request_pending"
      ON "access_requests" ("company_id", "user_id", "module") WHERE "status" = 'pending'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "access_requests"');
  }
}
