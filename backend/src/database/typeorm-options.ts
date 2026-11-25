import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import type { Env } from '../config/env.validation';
import { AccessRequest } from '../modules/access/entities/access-request.entity';
import { Company } from '../modules/companies/entities/company.entity';
import { Expense } from '../modules/expenses/entities/expense.entity';
import { ProductMovement } from '../modules/products/entities/product-movement.entity';
import { Product } from '../modules/products/entities/product.entity';
import { SaleItem } from '../modules/sales/entities/sale-item.entity';
import { Sale } from '../modules/sales/entities/sale.entity';
import { User } from '../modules/users/entities/user.entity';

export const ENTITIES = [Company, User, Product, Sale, SaleItem, AccessRequest, Expense, ProductMovement];

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
