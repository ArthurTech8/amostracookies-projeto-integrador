import { IsNull, type FindManyOptions } from 'typeorm';
import { hashPassword } from '../../common/utils/password';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../../common/validation/patterns';
import { UserRole } from '../../modules/users/entities/user-role.enum';
import { User } from '../../modules/users/entities/user.entity';

/** Parte do `Repository<User>` usada pelo seed. */
export interface SuperAdminStore {
  exists(options: FindManyOptions<User>): Promise<boolean>;
  save(user: User): Promise<User>;
}

export interface SuperAdminInput {
  username: string;
  password: string;
  name: string;
}

export type EnsureSuperAdminResult = 'created' | 'already-exists';

export class SuperAdminInputError extends Error {}

/** Lê e valida `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD` e `SUPER_ADMIN_NAME`. */
export function readSuperAdminInput(env: Record<string, string | undefined>): SuperAdminInput {
  const username = (env.SUPER_ADMIN_USERNAME ?? '').trim().toLowerCase();
  const password = env.SUPER_ADMIN_PASSWORD ?? '';
  const name = (env.SUPER_ADMIN_NAME ?? '').trim() || 'Super Admin';
  const errors: string[] = [];

  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH ||
    !USERNAME_PATTERN.test(username)
  ) {
    errors.push(
      `SUPER_ADMIN_USERNAME deve ter entre ${USERNAME_MIN_LENGTH} e ${USERNAME_MAX_LENGTH} caracteres: letras minúsculas, números, ponto, hífen ou sublinhado.`,
    );
  }
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    errors.push(
      `SUPER_ADMIN_PASSWORD deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`,
    );
  }
  if (name.length > 120) errors.push('SUPER_ADMIN_NAME deve ter no máximo 120 caracteres.');

  if (errors.length > 0) throw new SuperAdminInputError(errors.join('\n'));
  return { username, password, name };
}

/**
 * Cria o super admin se ainda não existir. Idempotente: se o usuário já existe,
 * não altera nada (nem a senha), para que um dev nunca sobrescreva o acesso de outro.
 */
export async function ensureSuperAdmin(
  usersRepository: SuperAdminStore,
  input: SuperAdminInput,
): Promise<EnsureSuperAdminResult> {
  const exists = await usersRepository.exists({
    where: { username: input.username, companyId: IsNull() },
  });
  if (exists) return 'already-exists';

  await usersRepository.save(
    Object.assign(new User(), {
      companyId: null,
      name: input.name,
      username: input.username,
      passwordHash: await hashPassword(input.password),
      role: UserRole.SuperAdmin,
      active: true,
    }),
  );
  return 'created';
}
