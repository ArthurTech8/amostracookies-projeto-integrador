import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { AccessService } from './access.service';
import { AccessRequest } from './entities/access-request.entity';

describe('AccessService', () => {
  let service: AccessService;
  const manager = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AccessService,
        {
          provide: getDataSourceToken(),
          useValue: { transaction: (callback: (value: typeof manager) => unknown) => callback(manager) },
        },
      ],
    }).compile();
    service = moduleRef.get(AccessService);
  });

  it('aprova o pedido e libera o módulo do funcionário da empresa', async () => {
    const request = { userId: 'staff-1', module: 'stock' };
    const staff = { active: true, permissions: { sales: 'view' } };
    manager.findOneBy.mockResolvedValue(request);
    manager.findOne.mockResolvedValueOnce(staff).mockResolvedValueOnce(request);

    await service.resolve('company-a', 'request-1', true);

    expect(manager.findOne).toHaveBeenCalledWith(User, expect.objectContaining({
      where: { id: 'staff-1', companyId: 'company-a', role: UserRole.Staff },
    }));
    expect(manager.save).toHaveBeenCalledWith({
      active: true, permissions: { sales: 'view', stock: 'operate' },
    });
    expect(manager.update).toHaveBeenCalledWith(
      AccessRequest, { companyId: 'company-a', id: 'request-1' }, { status: 'approved' },
    );
  });

  it('não altera funcionário de outra empresa', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(service.set('company-a', 'staff-other', { module: 'sales', level: 'view' }))
      .rejects.toThrow(NotFoundException);

    expect(manager.save).not.toHaveBeenCalled();
  });

  it('recusa o pedido sem conceder permissões', async () => {
    manager.findOneBy.mockResolvedValue({ userId: 'staff-1', module: 'stock' });
    manager.findOne.mockResolvedValue({ userId: 'staff-1', module: 'stock' });

    await service.resolve('company-a', 'request-1', false);

    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.update).toHaveBeenCalledWith(
      AccessRequest, { companyId: 'company-a', id: 'request-1' }, { status: 'rejected' },
    );
  });
});
