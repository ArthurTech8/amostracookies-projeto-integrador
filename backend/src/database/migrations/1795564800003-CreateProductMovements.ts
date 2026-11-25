import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductMovements1795564800003 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE "product_movements" (' +
      '"id" uuid CONSTRAINT "PK_product_movements" PRIMARY KEY DEFAULT gen_random_uuid(), ' +
      '"company_id" uuid NOT NULL CONSTRAINT "FK_product_movements_company_id" REFERENCES "companies" ("id") ON DELETE RESTRICT, ' +
      '"user_id" uuid NOT NULL CONSTRAINT "FK_product_movements_user_id" REFERENCES "users" ("id") ON DELETE RESTRICT, ' +
      '"product_id" uuid NOT NULL CONSTRAINT "FK_product_movements_product_id" REFERENCES "products" ("id") ON DELETE RESTRICT, ' +
      '"product_name" varchar(80) NOT NULL, "action" varchar(20) NOT NULL, ' +
      '"stock_delta" integer NULL, "created_at" timestamptz NOT NULL DEFAULT now())');
    await queryRunner.query(
      'CREATE INDEX "IDX_product_movements_company_date" ON "product_movements" ("company_id", "created_at")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "product_movements"');
  }
}
