import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  let service: ExpensesService;
  const repository = {
    create: jest.fn((input: Partial<Expense>) => Object.assign(new Expense(), input)),
    save: jest.fn((expense: Expense) => Promise.resolve(expense)),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: getRepositoryToken(Expense), useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(ExpensesService);
  });

  it('vincula empresa e autor da sessão ao criar a despesa', async () => {
    const expense = await service.create('company-a', 'user-1', {
      description: 'Embalagens', category: 'Compras', amount: 40.5, date: '2026-11-24', recurring: false,
    });

    expect(expense).toMatchObject({ companyId: 'company-a', createdById: 'user-1', amount: 40.5 });
  });

  it('restringe a exclusão à empresa da sessão', async () => {
    repository.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove('company-a', 'expense-other')).rejects.toThrow(NotFoundException);

    expect(repository.delete).toHaveBeenCalledWith({ companyId: 'company-a', id: 'expense-other' });
  });
});
