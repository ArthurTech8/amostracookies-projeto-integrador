import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENV_FILE_PATHS } from './config/env-files';
import { validateEnv, type Env } from './config/env.validation';
import { buildTypeOrmOptions } from './database/typeorm-options';
import { AccessModule } from './modules/access/access.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ProductsModule } from './modules/products/products.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SalesModule } from './modules/sales/sales.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ENV_FILE_PATHS, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        buildTypeOrmOptions({
          DATABASE_URL: config.get('DATABASE_URL', { infer: true }),
          DB_SSL: config.get('DB_SSL', { infer: true }),
        }),
    }),
    AuthModule,
    AccessModule,
    CompaniesModule,
    UsersModule,
    ProductsModule,
    ExpensesModule,
    ReportsModule,
    SalesModule,
  ],
})
export class AppModule {}
