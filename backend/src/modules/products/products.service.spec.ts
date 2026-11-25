import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { DeepPartial, FindManyOptions, FindOneOptions } from 'typeorm';
import { ProductMovement } from './entities/product-movement.entity';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

const USER_ID = 'employee-1';
const COMPANY_ID = 'company-a';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return Object.assign(new Product(), {
    id: 'product-1',
    companyId: COMPANY_ID,
    name: 'Cupcake',
    category: 'Cupcakes',
    description: '',
    cost: 4.5,
    price: 8,
    stock: 10,
    minStock: 5,
    active: true,
    ...overrides,
  });
}

describe('ProductsService', () => {
  let service: ProductsService;
  const repository = {
    find: jest.fn<Promise<Product[]>, [FindManyOptions<Product>]>(),
    findOne: jest.fn<Promise<Product | null>, [FindOneOptions<Product>]>(),
    create: jest.fn((data: DeepPartial<Product>) => Object.assign(new Product(), data)),
    save: jest.fn((product: Product) => Promise.resolve(product)),
    increment: jest.fn<Promise<unknown>, [Partial<Product>, string, number]>(),
  };

  const manager = {
    getRepository: () => repository,
    insert: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [ProductsService, { provide: getRepositoryToken(Product), useValue: {
        ...repository,
        manager: { transaction: (callback: (value: typeof manager) => unknown) => callback(manager) },
      } }],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  it('lista só os produtos da empresa do token', async () => {
    repository.find.mockResolvedValue([makeProduct()]);

    await service.findAll(COMPANY_ID);

    expect(repository.find.mock.calls[0][0].where).toEqual({ companyId: COMPANY_ID });
  });

  it('devolve 404 para produto de outra empresa', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(COMPANY_ID, 'produto-de-outra-empresa')).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findOne.mock.calls[0][0].where).toEqual({
      id: 'produto-de-outra-empresa',
      companyId: COMPANY_ID,
    });
  });

  it('cria o produto na empresa do token com valores padrão', async () => {
    const product = await service.create(COMPANY_ID, USER_ID, {
      name: 'Brigadeiro',
      category: 'Docinhos',
      cost: 0.8,
      price: 2.5,
    });

    expect(product).toMatchObject({
      companyId: COMPANY_ID,
      description: '',
      stock: 0,
      minStock: 0,
      active: true,
    });
  });

  it('altera só os campos enviados', async () => {
    repository.findOne.mockResolvedValue(makeProduct());

    const product = await service.update(COMPANY_ID, USER_ID, 'product-1', { price: 9.5 });

    expect(product).toMatchObject({ price: 9.5, cost: 4.5, name: 'Cupcake' });
  });

  it('excluir desativa o produto em vez de apagar', async () => {
    repository.findOne.mockResolvedValue(makeProduct());

    const product = await service.deactivate(COMPANY_ID, USER_ID, 'product-1');

    expect(product.active).toBe(false);
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
  });

  it('entrada de estoque soma de forma atômica, filtrando pela empresa', async () => {
    repository.findOne
      .mockResolvedValueOnce(makeProduct({ stock: 10 }))
      .mockResolvedValueOnce(makeProduct({ stock: 13 }));

    const product = await service.addStock(COMPANY_ID, USER_ID, 'product-1', 3);

    expect(repository.increment).toHaveBeenCalledWith(
      { id: 'product-1', companyId: COMPANY_ID },
      'stock',
      3,
    );
    expect(product.stock).toBe(13);
    expect(manager.insert).toHaveBeenCalledWith(
      ProductMovement,
      expect.objectContaining({ companyId: COMPANY_ID, userId: USER_ID, action: 'stock_entry', stockDelta: 3 }),
    );
  });

  it('entrada de estoque em produto de outra empresa devolve 404', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.addStock(COMPANY_ID, USER_ID, 'x', 3)).rejects.toThrow(NotFoundException);
    expect(repository.increment).not.toHaveBeenCalled();
    expect(manager.insert).not.toHaveBeenCalled();
  });

  it('recusa entrada que passaria do estoque máximo', async () => {
    repository.findOne.mockResolvedValue(makeProduct({ stock: 999_999 }));

    await expect(service.addStock(COMPANY_ID, USER_ID, 'product-1', 5)).rejects.toThrow(BadRequestException);
  });
});
