import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/users/entities/user-role.enum';
import { MODULE_ACCESS_KEY, type ModuleRule } from '../decorators/module-access.decorator';
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
    const rule = this.reflector.getAllAndOverride<ModuleRule | undefined>(MODULE_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (roles?.length && (!user || !roles.includes(user.role))) {
      throw new ForbiddenException('Você não tem permissão para esta ação.');
    }
    // Avalia a permissão atual do usuário a cada chamada, inclusive com um token antigo.
    if (rule && user?.role !== UserRole.Admin) {
      const allowed = rule.modules.some((module) => {
        const level = user?.permissions?.[module];
        return level === 'operate' || (level === 'view' && rule.level === 'view');
      });
      if (!allowed) throw new ForbiddenException('Você não tem acesso a este módulo.');
    }
    return true;
  }
}
