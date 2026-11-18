import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../modules/users/entities/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../types/auth-user';

/** Guard global: aplica as restrições de `@Roles(...)`. Roda depois do `JwtAuthGuard`. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Você não tem permissão para esta ação.');
    }
    return true;
  }
}
