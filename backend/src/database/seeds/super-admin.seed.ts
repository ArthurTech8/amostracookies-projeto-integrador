import { User } from '../../modules/users/entities/user.entity';
import { AppDataSource } from '../data-source';
import { ensureSuperAdmin, readSuperAdminInput } from './ensure-super-admin';

/** `npm run seed:super-admin` — cria o super admin definido no .env, se ainda não existir. */
async function run(): Promise<void> {
  const input = readSuperAdminInput(process.env);
  await AppDataSource.initialize();
  try {
    const result = await ensureSuperAdmin(AppDataSource.getRepository(User), input);
    console.log(
      result === 'created'
        ? `Super admin "${input.username}" criado.`
        : `Super admin "${input.username}" já existe. Nada foi alterado.`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
