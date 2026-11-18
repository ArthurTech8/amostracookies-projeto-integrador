import { randomUUID } from 'node:crypto';
import { FindOperator, type DeepPartial, type FindManyOptions } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';

type Where = Record<string, unknown>;

function readWhere(options: FindManyOptions<User> | undefined): Where {
  const where = options?.where;
  if (!where || Array.isArray(where)) return {};
  return Object.fromEntries(Object.entries(where));
}

function matches(user: User, where: Where): boolean {
  const fields = new Map<string, unknown>(Object.entries(user));
  return Object.entries(where).every(([key, expected]) => {
    if (key === 'company') {
      const slug =
        typeof expected === 'object' && expected !== null && 'slug' in expected
          ? expected.slug
          : undefined;
      return user.company?.slug === slug;
    }
    if (expected instanceof FindOperator) {
      return expected.type === 'isNull' ? fields.get(key) === null : false;
    }
    return fields.get(key) === expected;
  });
}

/**
 * Repositório de usuários em memória para os testes e2e: cobre só o que
 * AuthService, UsersService e JwtAuthGuard usam, sem precisar de banco.
 */
export class InMemoryUsersRepository {
  constructor(readonly users: User[]) {}

  findOne(options: FindManyOptions<User>): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => matches(u, readWhere(options))) ?? null);
  }

  find(options: FindManyOptions<User>): Promise<User[]> {
    return Promise.resolve(this.users.filter((u) => matches(u, readWhere(options))));
  }

  exists(options: FindManyOptions<User>): Promise<boolean> {
    return Promise.resolve(this.users.some((u) => matches(u, readWhere(options))));
  }

  count(options: FindManyOptions<User>): Promise<number> {
    return Promise.resolve(this.users.filter((u) => matches(u, readWhere(options))).length);
  }

  create(data: DeepPartial<User>): User {
    return Object.assign(new User(), data);
  }

  save(user: User): Promise<User> {
    if (!user.id) {
      user.id = randomUUID();
      user.createdAt = new Date();
      this.users.push(user);
    }
    user.updatedAt = new Date();
    return Promise.resolve(user);
  }
}
