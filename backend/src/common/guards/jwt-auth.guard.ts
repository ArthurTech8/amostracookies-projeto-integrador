import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest, JwtPayload } from '../types/auth-user';

const INVALID_SESSION = 'Sessão inválida ou expirada.';

/**
 * Guard global: exige um JWT válido em todas as rotas, exceto as marcadas com `@Public()`.
 * Confere no banco se o usuário e a empresa continuam ativos, para que desativar tenha efeito imediato.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    if (!token) throw new UnauthorizedException(INVALID_SESSION);

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      relations: { company: true },
    });
    if (!user || !user.active || (user.company && !user.company.active)) {
      throw new UnauthorizedException(INVALID_SESSION);
    }

    // Papel e empresa vêm do banco: mudanças feitas por um admin valem já na próxima requisição.
    request.user = { userId: user.id, companyId: user.companyId, role: user.role };
    return true;
  }

  private extractBearerToken(request: AuthenticatedRequest): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
