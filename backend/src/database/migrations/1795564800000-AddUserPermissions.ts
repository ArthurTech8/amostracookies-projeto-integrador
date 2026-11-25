import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPermissions1795564800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Mantém o acesso dos colaboradores existentes aos recursos que já usavam.
    await queryRunner.query(`ALTER TABLE "users" ADD "permissions" jsonb NOT NULL DEFAULT '{}'::jsonb`);
    await queryRunner.query(`
      UPDATE "users" SET "permissions" =
        '{"products":"operate","stock":"operate","sales":"operate","expenses":"operate","reports":"view"}'
      WHERE "role" = 'staff'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "permissions"`);
  }
}
