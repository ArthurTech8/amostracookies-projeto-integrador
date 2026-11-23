import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { MAX_MONEY } from '../products/dto/create-product.dto';
import { Product } from '../products/entities/product.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleItem } from './entities/sale-item.entity';
import { Sale } from './entities/sale.entity';

const SALE_NOT_FOUND = 'Venda não encontrada.';

/** Converte reais em centavos inteiros, para somar sem erro de arredondamento. */
function toCents(value: number): number {
  return Math.round(value * 100);
}

/** Vendas da empresa do token. Toda consulta filtra por `companyId`. */
@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepository: Repository<Sale>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Histórico de vendas, mais recentes primeiro. */
  findAll(companyId: string): Promise<Sale[]> {
    return this.salesRepository.find({
      where: { companyId },
      relations: { items: true },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(companyId: string, id: string): Promise<Sale> {
    // Venda de outra empresa é tratada como inexistente.
    const sale = await this.salesRepository.findOne({
      where: { id, companyId },
      relations: { items: true },
    });
    if (!sale) throw new NotFoundException(SALE_NOT_FOUND);
    return sale;
  }

  /** Registra a venda e baixa o estoque dos produtos na mesma transação. */
  create(companyId: string, userId: string, dto: CreateSaleDto): Promise<Sale> {
    return this.dataSource.transaction(async (manager) => {
      const productIds = dto.items.map((item) => item.productId);

      // Trava as linhas dos produtos até o fim da transação: duas vendas simultâneas
      // não conseguem vender o mesmo estoque. A ordem por id evita deadlock.
      const products = await manager.find(Product, {
        where: { id: In(productIds), companyId, active: true },
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });
      const productsById = new Map(products.map((product) => [product.id, product]));

      let subtotalCents = 0;
      const items = dto.items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) throw new NotFoundException('Produto não encontrado ou inativo.');
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Estoque insuficiente para ${product.name}.`);
        }
        subtotalCents += toCents(product.price) * item.quantity;
        return manager.create(SaleItem, {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          unitCost: product.cost,
        });
      });

      const discountCents = toCents(dto.discount ?? 0);
      if (subtotalCents > toCents(MAX_MONEY)) {
        throw new BadRequestException('O valor da venda é maior que o permitido.');
      }
      if (discountCents > subtotalCents) {
        throw new BadRequestException('O desconto não pode ser maior que o subtotal.');
      }

      for (const item of dto.items) {
        await manager.decrement(Product, { id: item.productId, companyId }, 'stock', item.quantity);
      }

      return manager.save(
        manager.create(Sale, {
          companyId,
          createdById: userId,
          date: dto.date,
          paymentMethod: dto.paymentMethod,
          subtotal: subtotalCents / 100,
          discount: discountCents / 100,
          total: (subtotalCents - discountCents) / 100,
          items,
        }),
      );
    });
  }

  /** Exclui a venda e devolve ao estoque as unidades vendidas, na mesma transação. */
  async remove(companyId: string, id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Trava a venda: duas exclusões simultâneas não devolvem o estoque duas vezes.
      const sale = await manager.findOne(Sale, {
        where: { id, companyId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) throw new NotFoundException(SALE_NOT_FOUND);

      const items = await manager.find(SaleItem, { where: { saleId: sale.id } });
      for (const item of items) {
        await manager.increment(Product, { id: item.productId, companyId }, 'stock', item.quantity);
      }
      // Os itens saem junto (ON DELETE CASCADE).
      await manager.delete(Sale, { id, companyId });
    });
  }
}
