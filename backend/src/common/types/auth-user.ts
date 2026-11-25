import type { ModulePermissions } from '../decorators/module-access.decorator';
import type { Request } from 'express';
import type { UserRole } from '../../modules/users/entities/user-role.enum';

/** Conteúdo assinado no JWT. */
export interface JwtPayload {
  sub: string;
  companyId: string | null;
  role: UserRole;
}

/** Usuário autenticado disponível nos controllers via `@CurrentUser()`. */
export interface AuthUser {
  permissions?: ModulePermissions;
  userId: string;
  companyId: string | null;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
