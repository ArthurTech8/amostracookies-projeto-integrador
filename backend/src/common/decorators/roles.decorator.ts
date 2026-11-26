import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../modules/users/entities/user-role.enum';

export const ROLES_KEY = 'roles';

/** Restringe a rota aos papéis informados. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
