import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../../common/utils/password';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user-role.enum';
import { User } from './entities/user.entity';
import { toUserResponse, type UserResponse } from './user-response';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>) {}

  async findAll(companyId: string): Promise<UserResponse[]> {
    const users = await this.usersRepository.find({
      where: { companyId },
      order: { name: 'ASC' },
    });
    return users.map(toUserResponse);
  }

  async create(companyId: string, dto: CreateUserDto): Promise<UserResponse> {
    const exists = await this.usersRepository.exists({
      where: { companyId, username: dto.username },
    });
    if (exists) {
      throw new ConflictException('Já existe um usuário com este nome nesta empresa.');
    }

    const user = this.usersRepository.create({
      companyId,
      name: dto.name,
      username: dto.username,
      passwordHash: await hashPassword(dto.password),
      role: dto.role,
      active: true,
    });
    return toUserResponse(await this.usersRepository.save(user));
  }

  async update(
    companyId: string,
    currentUserId: string,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponse> {
    // Sempre busca pela empresa do token: usuário de outra empresa é tratado como inexistente.
    const user = await this.usersRepository.findOne({ where: { id, companyId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const losesAdmin =
      user.role === UserRole.Admin &&
      user.active &&
      (dto.active === false || (dto.role !== undefined && dto.role !== UserRole.Admin));

    if (id === currentUserId && losesAdmin) {
      throw new BadRequestException('Você não pode desativar nem rebaixar o próprio usuário.');
    }

    if (losesAdmin) {
      const activeAdmins = await this.usersRepository.count({
        where: { companyId, role: UserRole.Admin, active: true },
      });
      if (activeAdmins <= 1) {
        throw new BadRequestException('A empresa precisa ter pelo menos um administrador ativo.');
      }
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.password !== undefined) user.passwordHash = await hashPassword(dto.password);

    return toUserResponse(await this.usersRepository.save(user));
  }
}
