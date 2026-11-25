import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateProductDto, MAX_STOCK } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductMovement, type ProductAction } from './entities/product-movement.entity';
import { Product } from './entities/product.entity';

/** Produtos da empresa do token. Toda consulta filtra por `companyId`. */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productsRepository: Repository<Product>,
  ) {}

  findAll(companyId: string): Promise<Product[]> {
    return this.productsRepository.find({ where: { companyId }, order: { name: 'ASC' } });
  }

  /** A operação de venda só precisa de produtos ativos, preço e disponibilidade. */
  saleOptions(companyId: string) {
    return this.productsRepository.find({
      where: { companyId, active: true },
      select: { id: true, name: true, price: true, stock: true },
      order: { name: 'ASC' },
    });
  }

  findOne(companyId: string, id: string): Promise<Product> {
    return this.getProduct(this.productsRepository, companyId, id);
  }

  listMovements(companyId: string): Promise<ProductMovement[]> {
    return this.productsRepository.manager.find(ProductMovement, {
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
  }

  create(companyId: string, userId: string, dto: CreateProductDto): Promise<Product> {
    return this.productsRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Product);
      const product = await repo.save(repo.create({
        companyId,
        name: dto.name,
        category: dto.category,
        description: dto.description ?? '',
        cost: dto.cost,
        price: dto.price,
        stock: dto.stock ?? 0,
        minStock: dto.minStock ?? 0,
        active: dto.active ?? true,
      }));
      await this.recordMovement(manager, product, userId, 'created', product.stock || null);
      return product;
    });
  }

  update(companyId: string, userId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    return this.productsRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Product);
      const product = await this.getProduct(repo, companyId, id, true);
      const previousStock = product.stock;
      if (dto.name !== undefined) product.name = dto.name;
      if (dto.category !== undefined) product.category = dto.category;
      if (dto.description !== undefined) product.description = dto.description;
      if (dto.cost !== undefined) product.cost = dto.cost;
      if (dto.price !== undefined) product.price = dto.price;
      if (dto.stock !== undefined) product.stock = dto.stock;
      if (dto.minStock !== undefined) product.minStock = dto.minStock;
      if (dto.active !== undefined) product.active = dto.active;
      const updated = await repo.save(product);
      await this.recordMovement(manager, updated, userId, 'updated', updated.stock - previousStock || null);
      return updated;
    });
  }

  /** Desativa o produto e mantém seu histórico de vendas e movimentações. */
  deactivate(companyId: string, userId: string, id: string): Promise<Product> {
    return this.productsRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Product);
      const product = await this.getProduct(repo, companyId, id, true);
      if (!product.active) return product;
      product.active = false;
      const updated = await repo.save(product);
      await this.recordMovement(manager, updated, userId, 'deactivated');
      return updated;
    });
  }

  /** O bloqueio é compartilhado com as vendas e protege o estoque e seu limite. */
  addStock(companyId: string, userId: string, id: string, quantity: number): Promise<Product> {
    return this.productsRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Product);
      const product = await this.getProduct(repo, companyId, id, true);
      if (product.stock + quantity > MAX_STOCK) {
        throw new BadRequestException('O estoque ficaria maior que o permitido.');
      }
      await repo.increment({ id, companyId }, 'stock', quantity);
      const updated = await this.getProduct(repo, companyId, id);
      await this.recordMovement(manager, updated, userId, 'stock_entry', quantity);
      return updated;
    });
  }

  private async getProduct(repo: Repository<Product>, companyId: string, id: string, write = false) {
    const product = await repo.findOne({
      where: { id, companyId },
      ...(write ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!product) throw new NotFoundException('Produto não encontrado.');
    return product;
  }

  private async recordMovement(
    manager: EntityManager,
    product: Product,
    userId: string,
    action: ProductAction,
    stockDelta: number | null = null,
  ): Promise<void> {
    // O histórico só é gravado se a operação do produto também for confirmada.
    await manager.insert(ProductMovement, {
      companyId: product.companyId,
      userId,
      productId: product.id,
      productName: product.name,
      action,
      stockDelta,
    });
  }
}
