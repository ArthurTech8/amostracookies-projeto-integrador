import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { loadEnvFiles } from '../config/env-files';
import { validateEnv } from '../config/env.validation';
import { buildTypeOrmOptions } from './typeorm-options';

// Usado pelo CLI do TypeORM (migration:generate / migration:run / migration:revert) e pelos seeds.
loadEnvFiles();

export const AppDataSource = new DataSource(buildTypeOrmOptions(validateEnv(process.env)));
