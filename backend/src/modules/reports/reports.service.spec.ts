import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('filtra todas as fontes pela empresa da sessão', async () => {
    const find = jest.fn().mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [ReportsService, { provide: getDataSourceToken(), useValue: { manager: { find } } }],
    }).compile();

    await moduleRef.get(ReportsService).read('company-a');

    for (const entity of [Sale, Expense, Product]) {
      expect(find).toHaveBeenCalledWith(entity, expect.objectContaining({
        where: { companyId: 'company-a' },
      }));
    }
  });
});
