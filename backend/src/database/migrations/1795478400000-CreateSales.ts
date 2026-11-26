import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSales1795478400000 implements MigrationInterface {
  name = 'CreateSales1795478400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sale_payment_method" AS ENUM('pix', 'cash', 'debit_card', 'credit_card', 'transfer', 'other')`,
    );

    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "company_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "sale_date" date NOT NULL,
        "payment_method" "public"."sale_payment_method" NOT NULL,
        "subtotal" numeric(12,2) NOT NULL,
        "discount" numeric(12,2) NOT NULL,
        "total" numeric(12,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_sales_discount" CHECK ("discount" >= 0 AND "discount" <= "subtotal"),
        CONSTRAINT "CHK_sales_total" CHECK ("total" >= 0),
        CONSTRAINT "FK_sales_company" FOREIGN KEY ("company_id")
          REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_sales_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_sales_company_date" ON "sales" ("company_id", "sale_date")`,
    );

    await queryRunner.query(`
      CREATE TABLE "sale_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sale_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "product_name" character varying(80) NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" numeric(12,2) NOT NULL,
        "unit_cost" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_sale_items" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_sale_items_quantity" CHECK ("quantity" > 0),
        CONSTRAINT "FK_sale_items_sale" FOREIGN KEY ("sale_id")
          REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_sale_items_product" FOREIGN KEY ("product_id")
          REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sale_items_sale" ON "sale_items" ("sale_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sale_items_product" ON "sale_items" ("product_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_sale_items_product"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sale_items_sale"`);
    await queryRunner.query(`DROP TABLE "sale_items"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_sales_company_date"`);
    await queryRunner.query(`DROP TABLE "sales"`);
    await queryRunner.query(`DROP TYPE "public"."sale_payment_method"`);
  }
}
