import { SetMetadata } from '@nestjs/common';

export const MODULE_ACCESS_KEY = 'moduleAccess';
export const ACCESS_MODULES = ['products', 'stock', 'sales', 'expenses', 'reports'] as const;
export type AccessModule = (typeof ACCESS_MODULES)[number];
export type AccessLevel = 'view' | 'operate';
export type ModulePermissions = Partial<Record<AccessModule, AccessLevel>>;
export type ModuleRule = { modules: AccessModule[]; level: AccessLevel };

export const ModuleAccess = (level: AccessLevel, ...modules: AccessModule[]) =>
  SetMetadata(MODULE_ACCESS_KEY, { modules, level } satisfies ModuleRule);
