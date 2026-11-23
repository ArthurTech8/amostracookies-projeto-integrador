import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto, MAX_STOCK } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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

  async findOne(companyId: string, id: string): Promise<Product> {
    // Produto de outra empresa é tratado como inexistente.
    const product = await this.productsRepository.findOne({ where: { id, companyId } });
    if (!product) throw new NotFoundException('Produto não encontrado.');
    return product;
  }

  create(companyId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      companyId,
      name: dto.name,
      category: dto.category,
      description: dto.description ?? '',
      cost: dto.cost,
      price: dto.price,
      stock: dto.stock ?? 0,
      minStock: dto.minStock ?? 0,
      active: dto.active ?? true,
    });
    return this.productsRepository.save(product);
  }

  async update(companyId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(companyId, id);
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.category !== undefined) product.category = dto.category;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.cost !== undefined) product.cost = dto.cost;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.minStock !== undefined) product.minStock = dto.minStock;
    if (dto.active !== undefined) product.active = dto.active;
    return this.productsRepository.save(product);
  }

  /** "Excluir" desativa o produto: ele sai das vendas, mas o histórico é preservado. */
  async deactivate(companyId: string, id: string): Promise<Product> {
    const product = await this.findOne(companyId, id);
    product.active = false;
    return this.productsRepository.save(product);
  }

  /** Soma unidades ao estoque de forma atômica (sem risco de perder entradas simultâneas). */
  async addStock(companyId: string, id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(companyId, id);
    if (product.stock + quantity > MAX_STOCK) {
      throw new BadRequestException('O estoque ficaria maior que o permitido.');
    }
    await this.productsRepository.increment({ id, companyId }, 'stock', quantity);
    return this.findOne(companyId, id);
  }
}
