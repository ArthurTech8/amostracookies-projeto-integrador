import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import type { Env } from '../config/env.validation';
import { Company } from '../modules/companies/entities/company.entity';
import { Product } from '../modules/products/entities/product.entity';
import { User } from '../modules/users/entities/user.entity';

export const ENTITIES = [Company, User, Product];

/** Opções do TypeORM compartilhadas pela aplicação, pelo CLI de migrations e pelos seeds. */
export function buildTypeOrmOptions(env: Pick<Env, 'DATABASE_URL' | 'DB_SSL'>): DataSourceOptions {
  return {
    type: 'postgres',
    url: env.DATABASE_URL,
    ssl: env.DB_SSL ? { rejectUnauthorized: true } : false,
    entities: ENTITIES,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
    migrationsRun: false,
    // gen_random_uuid() é nativo no PostgreSQL 13+; não tentamos instalar extensões.
    uuidExtension: 'pgcrypto',
    installExtensions: false,
  };
}
