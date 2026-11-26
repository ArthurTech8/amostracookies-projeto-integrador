import { compareSync } from 'bcryptjs';
import { UserRole } from '../../modules/users/entities/user-role.enum';
import type { User } from '../../modules/users/entities/user.entity';
import { ensureSuperAdmin, readSuperAdminInput, SuperAdminInputError } from './ensure-super-admin';

function makeRepository(alreadyExists: boolean) {
  return {
    exists: jest.fn(() => Promise.resolve(alreadyExists)),
    save: jest.fn((user: User) => Promise.resolve(user)),
  };
}

describe('readSuperAdminInput', () => {
  it('normaliza o usuário e usa nome padrão', () => {
    expect(
      readSuperAdminInput({ SUPER_ADMIN_USERNAME: '  Maria ', SUPER_ADMIN_PASSWORD: 'senha-123' }),
    ).toEqual({ username: 'maria', password: 'senha-123', name: 'Super Admin' });
  });

  it('recusa usuário inválido e senha curta', () => {
    expect(() =>
      readSuperAdminInput({ SUPER_ADMIN_USERNAME: 'a b', SUPER_ADMIN_PASSWORD: '123' }),
    ).toThrow(SuperAdminInputError);
  });
});

describe('ensureSuperAdmin', () => {
  const input = { username: 'maria', password: 'senha-forte-1', name: 'Maria' };

  it('cria o super admin sem empresa e com senha em hash', async () => {
    const repository = makeRepository(false);

    const result = await ensureSuperAdmin(repository, input);

    expect(result).toBe('created');
    const saved = repository.save.mock.calls[0][0];
    expect(saved).toMatchObject({ companyId: null, role: UserRole.SuperAdmin, username: 'maria' });
    expect(compareSync(input.password, saved.passwordHash)).toBe(true);
  });

  it('não altera nada se o super admin já existe', async () => {
    const repository = makeRepository(true);

    const result = await ensureSuperAdmin(repository, input);

    expect(result).toBe('already-exists');
    expect(repository.save).not.toHaveBeenCalled();
  });
});
