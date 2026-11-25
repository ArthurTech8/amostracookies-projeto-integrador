import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../products/entities/product.entity';
import { Sale } from '../sales/entities/sale.entity';

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async read(companyId: string) {
    // Relatórios têm permissão própria e retornam somente os campos usados nas análises.
    const [sales, expenses, products] = await Promise.all([
      this.dataSource.manager.find(Sale, {
        where: { companyId },
        relations: { items: true },
        select: {
          id: true, date: true, total: true,
          items: { id: true, productName: true, quantity: true, unitCost: true, unitPrice: true },
        },
      }),
      this.dataSource.manager.find(Expense, {
        where: { companyId },
        select: { id: true, date: true, description: true, category: true, amount: true, recurring: true },
      }),
      this.dataSource.manager.find(Product, {
        where: { companyId },
        select: { id: true, name: true, category: true, stock: true, minStock: true },
        order: { name: 'ASC' },
      }),
    ]);
    return { sales, expenses, products };
  }
}
