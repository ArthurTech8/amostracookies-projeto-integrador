import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { hashSync } from 'bcryptjs';
import { IsNull, Repository } from 'typeorm';
import type { AuthUser, JwtPayload } from '../../common/types/auth-user';
import { verifyPassword } from '../../common/utils/password';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

export const INVALID_LOGIN = 'Empresa, usuário ou senha inválidos.';

/**
 * Hash usado quando o usuário não existe, para que o tempo de resposta seja parecido
 * e não revele se o usuário ou a empresa existem.
 */
const DUMMY_PASSWORD_HASH = hashSync('senha-que-nunca-confere', 10);

export interface AuthProfile {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  company: { id: string; name: string; slug: string } | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthProfile;
}

function toAuthProfile(user: User): AuthProfile {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    company: user.company
      ? { id: user.company.id, name: user.company.name, slug: user.company.slug }
      : null,
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Com `companySlug`: procura o usuário dentro daquela empresa.
   * Sem `companySlug`: só aceita super admin.
   * Qualquer falha devolve a mesma mensagem, sem revelar o que estava errado.
   */
  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersRepository.findOne({
      where: dto.companySlug
        ? { username: dto.username, company: { slug: dto.companySlug } }
        : { username: dto.username, companyId: IsNull(), role: UserRole.SuperAdmin },
      relations: { company: true },
      select: {
        id: true,
        companyId: true,
        name: true,
        username: true,
        passwordHash: true,
        role: true,
        active: true,
        company: { id: true, name: true, slug: true, active: true },
      },
    });

    const passwordMatches = await verifyPassword(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !passwordMatches || !user.active || (user.company && !user.company.active)) {
      throw new UnauthorizedException(INVALID_LOGIN);
    }

    const payload: JwtPayload = { sub: user.id, companyId: user.companyId, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: toAuthProfile(user),
    };
  }

  async me(authUser: AuthUser): Promise<AuthProfile> {
    const user = await this.usersRepository.findOne({
      where: { id: authUser.userId },
      relations: { company: true },
    });
    if (!user) throw new UnauthorizedException('Sessão inválida ou expirada.');
    return toAuthProfile(user);
  }
}
