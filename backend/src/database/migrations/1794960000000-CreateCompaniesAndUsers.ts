import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompaniesAndUsers1794960000000 implements MigrationInterface {
  name = 'CreateCompaniesAndUsers1794960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'staff')`,
    );

    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "slug" character varying(60) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_companies_slug" ON "companies" ("slug")`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "company_id" uuid,
        "name" character varying(120) NOT NULL,
        "username" character varying(60) NOT NULL,
        "password_hash" character varying(100) NOT NULL,
        "role" "public"."user_role" NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_users_super_admin_company"
          CHECK (("role" = 'super_admin') = ("company_id" IS NULL)),
        CONSTRAINT "FK_users_company" FOREIGN KEY ("company_id")
          REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_company_username" ON "users" ("company_id", "username") WHERE "company_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_platform_username" ON "users" ("username") WHERE "company_id" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_users_platform_username"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_users_company_username"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_companies_slug"`);
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
  }
}
