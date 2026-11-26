import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1795392000000 implements MigrationInterface {
  name = 'CreateProducts1795392000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL,
        "name" character varying(80) NOT NULL,
        "category" character varying(60) NOT NULL,
        "description" character varying(500) NOT NULL DEFAULT '',
        "cost" numeric(12,2) NOT NULL,
        "price" numeric(12,2) NOT NULL,
        "stock" integer NOT NULL DEFAULT 0,
        "min_stock" integer NOT NULL DEFAULT 0,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_products_cost" CHECK ("cost" >= 0),
        CONSTRAINT "CHK_products_price" CHECK ("price" > 0),
        CONSTRAINT "CHK_products_stock" CHECK ("stock" >= 0),
        CONSTRAINT "CHK_products_min_stock" CHECK ("min_stock" >= 0),
        CONSTRAINT "FK_products_company" FOREIGN KEY ("company_id")
          REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_products_company" ON "products" ("company_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_products_company"`);
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
