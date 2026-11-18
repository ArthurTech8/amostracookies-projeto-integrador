import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, type DeepPartial, type EntityTarget } from 'typeorm';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';

type Entity = Company | User;

describe('CompaniesService', () => {
  let service: CompaniesService;
  let savedEntities: Entity[];

  const repository = {
    exists: jest.fn<Promise<boolean>, [unknown]>(),
    find: jest.fn<Promise<Company[]>, [unknown]>(),
    findOne: jest.fn<Promise<Company | null>, [unknown]>(),
    save: jest.fn((company: Company) => Promise.resolve(company)),
  };

  const manager = {
    create: jest.fn((target: EntityTarget<Entity>, data: DeepPartial<Entity>) =>
      Object.assign(target === Company ? new Company() : new User(), data),
    ),
    save: jest.fn((entity: Entity) => {
      const saved = Object.assign(entity, { id: `${entity.constructor.name}-id` });
      savedEntities.push(saved);
      return Promise.resolve(saved);
    }),
  };

  const dataSource = {
    transaction: jest.fn((work: (m: typeof manager) => Promise<unknown>) => work(manager)),
  };

  const dto = {
    name: 'Doce da Ana',
    slug: 'doce-da-ana',
    admin: { name: 'Ana', username: 'ana', password: 'senha-forte-1' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    savedEntities = [];
    const moduleRef = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getRepositoryToken(Company), useValue: repository },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(CompaniesService);
  });

  it('cria a empresa e o primeiro admin na mesma transação', async () => {
    repository.exists.mockResolvedValue(false);

    const result = await service.create(dto);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    const [company, admin] = savedEntities;
    expect(company).toBeInstanceOf(Company);
    expect(admin).toBeInstanceOf(User);
    expect(admin).toMatchObject({ companyId: company.id, role: UserRole.Admin, username: 'ana' });
    expect((admin as User).passwordHash).not.toBe(dto.admin.password);
    expect(result.slug).toBe('doce-da-ana');
    expect(result.admin).toMatchObject({ username: 'ana', role: UserRole.Admin });
    expect(result.admin).not.toHaveProperty('passwordHash');
  });

  it('recusa código de empresa repetido antes de abrir a transação', async () => {
    repository.exists.mockResolvedValue(true);

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('converte violação de unicidade na gravação em 409', async () => {
    repository.exists.mockResolvedValue(false);
    dataSource.transaction.mockRejectedValueOnce(
      new QueryFailedError('INSERT', [], Object.assign(new Error('duplicado'), { code: '23505' })),
    );

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('devolve 404 para empresa inexistente', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
  });

  it('atualiza nome e status, sem mexer no código', async () => {
    repository.findOne.mockResolvedValue(
      Object.assign(new Company(), { id: 'c1', name: 'Antigo', slug: 'antigo', active: true }),
    );

    const company = await service.update('c1', { name: 'Novo', active: false });

    expect(company).toMatchObject({ name: 'Novo', active: false, slug: 'antigo' });
  });
});
