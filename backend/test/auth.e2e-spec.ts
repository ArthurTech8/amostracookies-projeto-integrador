import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { setupApp } from '../src/app.setup';
import { validateEnv } from '../src/config/env.validation';
import { AccessController } from '../src/modules/access/access.controller';
import { AccessService } from '../src/modules/access/access.service';
import { ExpensesController } from '../src/modules/expenses/expenses.controller';
import { ExpensesService } from '../src/modules/expenses/expenses.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { Company } from '../src/modules/companies/entities/company.entity';
import { UserRole } from '../src/modules/users/entities/user-role.enum';
import { User } from '../src/modules/users/entities/user.entity';
import { UsersModule } from '../src/modules/users/users.module';
import { InMemoryUsersRepository } from './in-memory-users.repository';

const PASSWORD = 'senha-forte-1';
const PASSWORD_HASH = hashSync(PASSWORD, 4);

function company(id: string, slug: string): Company {
  return Object.assign(new Company(), { id, name: `Empresa ${slug}`, slug, active: true });
}

function user(data: Partial<User>): User {
  return Object.assign(new User(), {
    passwordHash: PASSWORD_HASH,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  });
}

interface LoginBody {
  accessToken: string;
  user: { id: string; role: UserRole; company: { slug: string } | null };
}

describe('Autenticação e isolamento por empresa (e2e)', () => {
  let app: INestApplication<App>;
  const access = { request: jest.fn().mockResolvedValue(undefined), list: jest.fn().mockResolvedValue([]) };
  const expenses = { list: jest.fn().mockResolvedValue([]), create: jest.fn() };
  const empresaA = company('11111111-1111-4111-8111-111111111111', 'empresa-a');
  const empresaB = company('22222222-2222-4222-8222-222222222222', 'empresa-b');

  beforeAll(async () => {
    const users = new InMemoryUsersRepository([
      user({
        id: 'aaaaaaaa-0000-4000-8000-000000000001',
        companyId: null,
        company: null,
        name: 'Root',
        username: 'root',
        role: UserRole.SuperAdmin,
      }),
      user({
        id: 'aaaaaaaa-0000-4000-8000-000000000002',
        companyId: empresaA.id,
        company: empresaA,
        name: 'Ana A',
        username: 'ana',
        role: UserRole.Admin,
      }),
      user({
        id: 'aaaaaaaa-0000-4000-8000-000000000003',
        companyId: empresaA.id,
        company: empresaA,
        name: 'Bia A',
        username: 'bia',
        role: UserRole.Staff,
        permissions: { expenses: 'view' },
      }),
      user({
        id: 'aaaaaaaa-0000-4000-8000-000000000004',
        companyId: empresaB.id,
        company: empresaB,
        name: 'Ana B',
        username: 'ana',
        role: UserRole.Admin,
      }),
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          validate: () =>
            validateEnv({
              DATABASE_URL: 'postgresql://usuario:senha@localhost:5432/teste',
              JWT_SECRET: 'segredo-de-teste-com-mais-de-32-caracteres',
            }),
        }),
        AuthModule,
        UsersModule,
      ],
      controllers: [AccessController, ExpensesController],
      providers: [
        { provide: AccessService, useValue: access },
        { provide: ExpensesService, useValue: expenses },
      ],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(users)
      .compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(body: object): Promise<LoginBody> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(body)
      .expect(200);
    return response.body as LoginBody;
  }

  it('rotas protegidas exigem token', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('o mesmo usuário em duas empresas entra cada um na sua', async () => {
    const a = await login({ companySlug: 'empresa-a', username: 'ana', password: PASSWORD });
    const b = await login({ companySlug: 'Empresa-B', username: ' ANA ', password: PASSWORD });

    expect(a.user.company?.slug).toBe('empresa-a');
    expect(b.user.company?.slug).toBe('empresa-b');
    expect(a.user.id).not.toBe(b.user.id);
  });

  it('recusa senha errada com mensagem genérica', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ companySlug: 'empresa-a', username: 'ana', password: 'errada-123' })
      .expect(401);
    expect((response.body as { message: string }).message).toBe(
      'Empresa, usuário ou senha inválidos.',
    );
  });

  it('super admin entra sem código da empresa', async () => {
    const root = await login({ username: 'root', password: PASSWORD });
    expect(root.user).toMatchObject({ role: UserRole.SuperAdmin, company: null });
  });

  it('admin vê só os usuários da própria empresa', async () => {
    const { accessToken } = await login({
      companySlug: 'empresa-a',
      username: 'ana',
      password: PASSWORD,
    });

    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const list = response.body as { companyId: string; passwordHash?: string }[];
    expect(list).toHaveLength(2);
    expect(list.every((u) => u.companyId === empresaA.id)).toBe(true);
    expect(list.every((u) => u.passwordHash === undefined)).toBe(true);
  });

  it('não aceita companyId no corpo da requisição', async () => {
    const { accessToken } = await login({
      companySlug: 'empresa-a',
      username: 'ana',
      password: PASSWORD,
    });

    await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Intrusa',
        username: 'intrusa',
        password: PASSWORD,
        role: UserRole.Staff,
        companyId: empresaB.id,
      })
      .expect(400);
  });

  it('admin não edita usuário de outra empresa', async () => {
    const { accessToken } = await login({
      companySlug: 'empresa-a',
      username: 'ana',
      password: PASSWORD,
    });

    await request(app.getHttpServer())
      .patch('/api/users/aaaaaaaa-0000-4000-8000-000000000004')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Hackeada' })
      .expect(404);
  });

  it('permite visualizar despesas e bloqueia operação sem a permissão correspondente', async () => {
    const { accessToken } = await login({ companySlug: 'empresa-a', username: 'bia', password: PASSWORD });
    const authorization = 'Bearer ' + accessToken;

    await request(app.getHttpServer()).get('/api/expenses').set('Authorization', authorization).expect(200);
    await request(app.getHttpServer()).post('/api/expenses').set('Authorization', authorization).send({}).expect(403);

    expect(expenses.list).toHaveBeenCalledWith(empresaA.id);
    expect(expenses.create).not.toHaveBeenCalled();
  });

  it('aceita pedido de acesso do funcionário e restringe a fila à gerência', async () => {
    const employee = await login({ companySlug: 'empresa-a', username: 'bia', password: PASSWORD });
    const admin = await login({ companySlug: 'empresa-a', username: 'ana', password: PASSWORD });

    await request(app.getHttpServer()).post('/api/access/requests')
      .set('Authorization', 'Bearer ' + employee.accessToken).send({ module: 'sales' }).expect(204);
    await request(app.getHttpServer()).get('/api/access/requests')
      .set('Authorization', 'Bearer ' + employee.accessToken).expect(403);
    await request(app.getHttpServer()).get('/api/access/requests')
      .set('Authorization', 'Bearer ' + admin.accessToken).expect(200);

    expect(access.request).toHaveBeenCalledWith(empresaA.id, employee.user.id, { module: 'sales' });
    expect(access.list).toHaveBeenCalledWith(empresaA.id);
  });

  it('colaborador não acessa a gestão de usuários', async () => {
    const { accessToken } = await login({
      companySlug: 'empresa-a',
      username: 'bia',
      password: PASSWORD,
    });

    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
