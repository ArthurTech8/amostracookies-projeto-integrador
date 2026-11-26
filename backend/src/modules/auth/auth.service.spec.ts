import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hashSync } from 'bcryptjs';
import type { FindOneOptions } from 'typeorm';
import type { JwtPayload } from '../../common/types/auth-user';
import { Company } from '../companies/entities/company.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { AuthService, INVALID_LOGIN } from './auth.service';

const PASSWORD = 'senha-correta';
const PASSWORD_HASH = hashSync(PASSWORD, 4);

function makeCompany(overrides: Partial<Company> = {}): Company {
  return Object.assign(new Company(), {
    id: 'company-a',
    name: 'Empresa A',
    slug: 'empresa-a',
    active: true,
    ...overrides,
  });
}

function makeUser(overrides: Partial<User> = {}): User {
  const company = overrides.company === undefined ? makeCompany() : overrides.company;
  return Object.assign(new User(), {
    id: 'user-1',
    companyId: company?.id ?? null,
    company,
    name: 'Ana',
    username: 'ana',
    passwordHash: PASSWORD_HASH,
    role: UserRole.Admin,
    active: true,
    ...overrides,
  });
}

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  const findOne = jest.fn<Promise<User | null>, [FindOneOptions<User>]>();

  beforeEach(async () => {
    findOne.mockReset();
    jwtService = new JwtService({ secret: 'segredo-de-teste-com-mais-de-32-caracteres' });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(User), useValue: { findOne } },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('autentica usuário da empresa e devolve token com companyId e papel', async () => {
    findOne.mockResolvedValue(makeUser());

    const result = await service.login({
      companySlug: 'empresa-a',
      username: 'ana',
      password: PASSWORD,
    });

    expect(findOne.mock.calls[0][0].where).toEqual({
      username: 'ana',
      company: { slug: 'empresa-a' },
    });
    const payload = await jwtService.verifyAsync<JwtPayload>(result.accessToken);
    expect(payload).toMatchObject({ sub: 'user-1', companyId: 'company-a', role: UserRole.Admin });
    expect(result.user).toEqual({
      id: 'user-1',
      name: 'Ana',
      username: 'ana',
      role: UserRole.Admin,
      company: { id: 'company-a', name: 'Empresa A', slug: 'empresa-a' },
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('o mesmo usuário em empresas diferentes entra cada um na sua empresa', async () => {
    findOne.mockImplementation((options) => {
      const where = options.where as { company?: { slug: string } };
      const slug = where.company?.slug;
      const company = makeCompany({ id: `id-${slug}`, slug, name: `Empresa ${slug}` });
      return Promise.resolve(makeUser({ id: `ana-${slug}`, company }));
    });

    const a = await service.login({
      companySlug: 'empresa-a',
      username: 'ana',
      password: PASSWORD,
    });
    const b = await service.login({
      companySlug: 'empresa-b',
      username: 'ana',
      password: PASSWORD,
    });

    expect(a.user.company?.id).toBe('id-empresa-a');
    expect(b.user.company?.id).toBe('id-empresa-b');
    expect(a.user.id).not.toBe(b.user.id);
  });

  it('sem código da empresa, só procura super admin sem empresa', async () => {
    findOne.mockResolvedValue(
      makeUser({ id: 'root', company: null, companyId: null, role: UserRole.SuperAdmin }),
    );

    const result = await service.login({ username: 'root', password: PASSWORD });

    expect(findOne.mock.calls[0][0].where).toMatchObject({
      username: 'root',
      role: UserRole.SuperAdmin,
    });
    expect(result.user.company).toBeNull();
    expect(result.user.role).toBe(UserRole.SuperAdmin);
  });

  it.each([
    ['empresa ou usuário inexistente', () => null, PASSWORD],
    ['senha errada', () => makeUser(), 'senha-errada'],
    ['usuário inativo', () => makeUser({ active: false }), PASSWORD],
    ['empresa inativa', () => makeUser({ company: makeCompany({ active: false }) }), PASSWORD],
  ])('recusa login com a mesma mensagem: %s', async (_case, buildUser, password) => {
    findOne.mockResolvedValue(buildUser());

    const attempt = service.login({ companySlug: 'empresa-a', username: 'ana', password });

    await expect(attempt).rejects.toThrow(UnauthorizedException);
    await expect(attempt).rejects.toThrow(INVALID_LOGIN);
  });

  it('me devolve o perfil do usuário do token', async () => {
    findOne.mockResolvedValue(makeUser());

    const profile = await service.me({
      userId: 'user-1',
      companyId: 'company-a',
      role: UserRole.Admin,
    });

    expect(profile.username).toBe('ana');
    expect(profile.company?.slug).toBe('empresa-a');
  });
});
