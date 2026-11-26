import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from '../types/auth-user';

/** Devolve o `companyId` do token; falha se o usuário não pertencer a uma empresa. */
export function requireCompanyId(user: AuthUser): string {
  if (!user.companyId) {
    throw new ForbiddenException('Esta ação exige um usuário vinculado a uma empresa.');
  }
  return user.companyId;
}
