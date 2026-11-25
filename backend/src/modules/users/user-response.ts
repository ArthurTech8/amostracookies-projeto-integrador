import type { ModulePermissions } from '../../common/decorators/module-access.decorator';
import type { User } from './entities/user.entity';
import type { UserRole } from './entities/user-role.enum';

/** Formato de usuário devolvido pela API. Nunca inclui o hash da senha. */
export interface UserResponse {
  id: string;
  companyId: string | null;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
  permissions?: ModulePermissions;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    username: user.username,
    role: user.role,
    active: user.active,
    permissions: user.permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
