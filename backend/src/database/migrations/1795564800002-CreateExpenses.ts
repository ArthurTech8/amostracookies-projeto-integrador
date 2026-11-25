import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpenses1795564800002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE "expenses" (' +
      '"id" uuid CONSTRAINT "PK_expenses" PRIMARY KEY DEFAULT gen_random_uuid(), ' +
      '"company_id" uuid NOT NULL CONSTRAINT "FK_expenses_company_id" REFERENCES "companies" ("id") ON DELETE RESTRICT, ' +
      '"created_by_id" uuid NOT NULL CONSTRAINT "FK_expenses_created_by_id" REFERENCES "users" ("id") ON DELETE RESTRICT, ' +
      '"description" varchar(160) NOT NULL, "category" varchar(80) NOT NULL, ' +
      '"amount" numeric(12,2) NOT NULL CONSTRAINT "CHK_expenses_amount" CHECK ("amount" > 0), ' +
      '"date" date NOT NULL, "recurring" boolean NOT NULL)');
    await queryRunner.query('CREATE INDEX "IDX_expenses_company_date" ON "expenses" ("company_id", "date")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "expenses"');
  }
}
