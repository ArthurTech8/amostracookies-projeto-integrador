import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.enum';
import type { RequestAccessDto, SetAccessDto } from './dto/access.dto';
import { AccessRequest } from './entities/access-request.entity';

@Injectable()
export class AccessService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  list(companyId: string): Promise<AccessRequest[]> {
    return this.dataSource.manager.find(AccessRequest, {
      where: { companyId, status: 'pending' },
      order: { createdAt: 'ASC' },
    });
  }

  async request(companyId: string, userId: string, dto: RequestAccessDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.lockStaff(manager, companyId, userId);
      if (!user.active || user.permissions[dto.module] === 'operate') {
        throw new BadRequestException('O usuário não precisa solicitar acesso a este módulo.');
      }
      // O índice parcial garante um único pedido pendente mesmo em requisições simultâneas.
      await manager.createQueryBuilder().insert().into(AccessRequest)
        .values({ companyId, userId, module: dto.module }).orIgnore().execute();
    });
  }

  async set(companyId: string, userId: string, dto: SetAccessDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.lockStaff(manager, companyId, userId);
      if (dto.level === 'none') delete user.permissions[dto.module];
      else user.permissions[dto.module] = dto.module === 'reports' ? 'view' : dto.level;
      await manager.save(user);
    });
  }

  async resolve(companyId: string, id: string, approved: boolean): Promise<void> {
    // Aprovação e liberação são confirmadas juntas; apenas a primeira decisão tem efeito.
    await this.dataSource.transaction(async (manager) => {
      const candidate = await manager.findOneBy(AccessRequest, { companyId, id, status: 'pending' });
      if (!candidate) throw new NotFoundException('Solicitação pendente não encontrada.');
      const staff = approved ? await this.lockStaff(manager, companyId, candidate.userId) : null;
      const request = await manager.findOne(AccessRequest, {
        where: { companyId, id, status: 'pending' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!request) throw new NotFoundException('Solicitação pendente não encontrada.');
      if (staff) {
        if (!staff.active) throw new BadRequestException('O funcionário está inativo.');
        staff.permissions[request.module] = request.module === 'reports' ? 'view' : 'operate';
        await manager.save(staff);
      }
      await manager.update(AccessRequest, { companyId, id }, {
        status: approved ? 'approved' : 'rejected',
      });
    });
  }

  private async lockStaff(manager: EntityManager, companyId: string, id: string): Promise<User> {
    const user = await manager.findOne(User, {
      where: { id, companyId, role: UserRole.Staff },
      lock: { mode: 'pessimistic_write' },
    });
    if (!user) throw new NotFoundException('Funcionário não encontrado.');
    return user;
  }
}
