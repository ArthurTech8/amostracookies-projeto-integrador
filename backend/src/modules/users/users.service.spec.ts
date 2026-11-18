import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { compareSync } from 'bcryptjs';
import type { DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';
import type { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './entities/user-role.enum';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

const COMPANY_ID = 'company-a';

function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'user-1',
    companyId: COMPANY_ID,
    name: 'Ana',
    username: 'ana',
    passwordHash: 'hash-antigo',
    role: UserRole.Admin,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
}

describe('UsersService', () => {
  let service: UsersService;
  const repository = {
    find: jest.fn<Promise<User[]>, [FindManyOptions<User>]>(),
    findOne: jest.fn<Promise<User | null>, [FindOneOptions<User>]>(),
    exists: jest.fn<Promise<boolean>, [FindManyOptions<User>]>(),
    count: jest.fn<Promise<number>, [FindManyOptions<User>]>(),
    create: jest.fn((data: DeepPartial<User>) => Object.assign(new User(), data)),
    save: jest.fn((user: User) =>
      Promise.resolve(Object.assign(new User(), { id: user.id ?? 'new-id' }, user)),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: repository }],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  describe('findAll', () => {
    it('lista só os usuários da empresa do token, sem hash de senha', async () => {
      repository.find.mockResolvedValue([makeUser()]);

      const users = await service.findAll(COMPANY_ID);

      expect(repository.find.mock.calls[0][0].where).toEqual({ companyId: COMPANY_ID });
      expect(users[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('create', () => {
    const dto: CreateUserDto = {
      name: 'Bia',
      username: 'bia',
      password: 'senha-forte-1',
      role: UserRole.Staff,
    };

    it('cria o usuário na empresa do token com a senha em hash', async () => {
      repository.exists.mockResolvedValue(false);

      const user = await service.create(COMPANY_ID, dto);

      const saved = repository.save.mock.calls[0][0];
      expect(saved.companyId).toBe(COMPANY_ID);
      expect(saved.passwordHash).not.toBe(dto.password);
      expect(compareSync(dto.password, saved.passwordHash)).toBe(true);
      expect(user).toMatchObject({ companyId: COMPANY_ID, username: 'bia', role: UserRole.Staff });
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('recusa usuário repetido na mesma empresa', async () => {
      repository.exists.mockResolvedValue(true);

      await expect(service.create(COMPANY_ID, dto)).rejects.toThrow(ConflictException);
      expect(repository.exists.mock.calls[0][0].where).toEqual({
        companyId: COMPANY_ID,
        username: 'bia',
      });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('busca sempre pela empresa do token e devolve 404 para usuário de outra empresa', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(COMPANY_ID, 'admin-1', 'user-de-outra-empresa', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.findOne.mock.calls[0][0].where).toEqual({
        id: 'user-de-outra-empresa',
        companyId: COMPANY_ID,
      });
    });

    it('impede o admin de se desativar', async () => {
      repository.findOne.mockResolvedValue(makeUser({ id: 'admin-1' }));

      await expect(
        service.update(COMPANY_ID, 'admin-1', 'admin-1', { active: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('impede o admin de se rebaixar', async () => {
      repository.findOne.mockResolvedValue(makeUser({ id: 'admin-1' }));

      await expect(
        service.update(COMPANY_ID, 'admin-1', 'admin-1', { role: UserRole.Staff }),
      ).rejects.toThrow(BadRequestException);
    });

    it('impede remover o último admin ativo da empresa', async () => {
      repository.findOne.mockResolvedValue(makeUser({ id: 'admin-2' }));
      repository.count.mockResolvedValue(1);

      await expect(
        service.update(COMPANY_ID, 'admin-1', 'admin-2', { active: false }),
      ).rejects.toThrow('A empresa precisa ter pelo menos um administrador ativo.');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('permite rebaixar outro admin quando ainda sobra um admin ativo', async () => {
      repository.findOne.mockResolvedValue(makeUser({ id: 'admin-2' }));
      repository.count.mockResolvedValue(2);

      const user = await service.update(COMPANY_ID, 'admin-1', 'admin-2', {
        role: UserRole.Staff,
      });

      expect(user.role).toBe(UserRole.Staff);
    });

    it('troca a senha gravando um novo hash', async () => {
      repository.findOne.mockResolvedValue(makeUser({ id: 'staff-1', role: UserRole.Staff }));

      await service.update(COMPANY_ID, 'admin-1', 'staff-1', { password: 'nova-senha-123' });

      const saved = repository.save.mock.calls[0][0];
      expect(compareSync('nova-senha-123', saved.passwordHash)).toBe(true);
    });
  });
});
