import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CreateExpenseDto } from './dto/create-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(@InjectRepository(Expense) private readonly expenses: Repository<Expense>) {}

  list(companyId: string): Promise<Expense[]> {
    return this.expenses.find({ where: { companyId }, order: { date: 'DESC' } });
  }

  create(companyId: string, userId: string, dto: CreateExpenseDto): Promise<Expense> {
    // Empresa e autor vêm da sessão autenticada.
    return this.expenses.save(this.expenses.create({ ...dto, companyId, createdById: userId }));
  }

  async remove(companyId: string, id: string): Promise<void> {
    const result = await this.expenses.delete({ companyId, id });
    if (!result.affected) throw new NotFoundException('Despesa não encontrada.');
  }
}
