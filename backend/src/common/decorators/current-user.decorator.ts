import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest, AuthUser } from '../types/auth-user';

/** Injeta o usuário autenticado (`{ userId, companyId, role }`) vindo do token. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) throw new UnauthorizedException('Sessão inválida ou expirada.');
    return request.user;
  },
);
