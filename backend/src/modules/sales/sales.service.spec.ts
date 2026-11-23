import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import type { DeepPartial, EntityTarget, FindManyOptions, FindOneOptions } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import type { CreateSaleDto } from './dto/create-sale.dto';
import { PaymentMethod } from './entities/payment-method.enum';
import { SaleItem } from './entities/sale-item.entity';
import { Sale } from './entities/sale.entity';
import { SalesService } from './sales.service';

const COMPANY_ID = 'company-a';
const USER_ID = 'user-1';

type Entity = Sale | SaleItem;

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

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return Object.assign(new Sale(), {
    id: 'sale-1',
    companyId: COMPANY_ID,
    createdById: USER_ID,
    date: '2026-11-23',
    paymentMethod: PaymentMethod.Pix,
    subtotal: 16,
    discount: 0,
    total: 16,
    items: [],
    ...overrides,
  });
}

function makeItem(overrides: Partial<SaleItem> = {}): SaleItem {
  return Object.assign(new SaleItem(), {
    id: 'item-1',
    saleId: 'sale-1',
    productId: 'product-1',
    productName: 'Cupcake',
    quantity: 2,
    unitPrice: 8,
    unitCost: 4.5,
    ...overrides,
  });
}

describe('SalesService', () => {
  let service: SalesService;

  const repository = {
    find: jest.fn<Promise<Sale[]>, [FindManyOptions<Sale>]>(),
    findOne: jest.fn<Promise<Sale | null>, [FindOneOptions<Sale>]>(),
  };

  const manager = {
    find: jest.fn<Promise<Product[] | SaleItem[]>, [EntityTarget<unknown>, FindManyOptions]>(),
    findOne: jest.fn<Promise<Sale | null>, [EntityTarget<Sale>, FindOneOptions<Sale>]>(),
    create: jest.fn((target: EntityTarget<Entity>, data: DeepPartial<Entity>) =>
      Object.assign(target === Sale ? new Sale() : new SaleItem(), data),
    ),
    save: jest.fn((entity: Sale) => Promise.resolve(entity)),
    decrement: jest.fn<Promise<unknown>, [EntityTarget<Product>, object, string, number]>(),
    increment: jest.fn<Promise<unknown>, [EntityTarget<Product>, object, string, number]>(),
    delete: jest.fn<Promise<unknown>, [EntityTarget<Sale>, object]>(),
  };

  const dataSource = {
    transaction: jest.fn((work: (m: typeof manager) => Promise<unknown>) => work(manager)),
  };

  const dto: CreateSaleDto = {
    items: [{ productId: 'product-1', quantity: 2 }],
    discount: 1.5,
    paymentMethod: PaymentMethod.Pix,
    date: '2026-11-23',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useValue: repository },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();
    service = moduleRef.get(SalesService);
  });

  describe('findAll / findOne', () => {
    it('lista só as vendas da empresa do token, com os itens', async () => {
      repository.find.mockResolvedValue([makeSale()]);

      await service.findAll(COMPANY_ID);

      const options = repository.find.mock.calls[0][0];
      expect(options.where).toEqual({ companyId: COMPANY_ID });
      expect(options.relations).toEqual({ items: true });
    });

    it('devolve 404 para venda de outra empresa', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(COMPANY_ID, 'venda-de-outra-empresa')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findOne.mock.calls[0][0].where).toEqual({
        id: 'venda-de-outra-empresa',
        companyId: COMPANY_ID,
      });
    });
  });

  describe('create', () => {
    it('registra a venda com preço e custo do cadastro e baixa o estoque na transação', async () => {
      manager.find.mockResolvedValue([makeProduct()]);

      const sale = await service.create(COMPANY_ID, USER_ID, dto);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      const findOptions = manager.find.mock.calls[0][1];
      expect(findOptions.where).toMatchObject({ companyId: COMPANY_ID, active: true });
      expect(findOptions.lock).toEqual({ mode: 'pessimistic_write' });
      expect(manager.decrement).toHaveBeenCalledWith(
        Product,
        { id: 'product-1', companyId: COMPANY_ID },
        'stock',
        2,
      );
      expect(sale).toMatchObject({
        companyId: COMPANY_ID,
        createdById: USER_ID,
        subtotal: 16,
        discount: 1.5,
        total: 14.5,
        paymentMethod: PaymentMethod.Pix,
        date: '2026-11-23',
      });
      expect(sale.items[0]).toMatchObject({
        productId: 'product-1',
        productName: 'Cupcake',
        quantity: 2,
        unitPrice: 8,
        unitCost: 4.5,
      });
    });

    it('soma valores em centavos sem erro de arredondamento', async () => {
      manager.find.mockResolvedValue([makeProduct({ price: 0.1 })]);

      const sale = await service.create(COMPANY_ID, USER_ID, {
        ...dto,
        items: [{ productId: 'product-1', quantity: 3 }],
        discount: 0,
      });

      expect(sale.subtotal).toBe(0.3);
      expect(sale.total).toBe(0.3);
    });

    it('recusa estoque insuficiente sem baixar nada', async () => {
      manager.find.mockResolvedValue([makeProduct({ stock: 1 })]);

      await expect(service.create(COMPANY_ID, USER_ID, dto)).rejects.toThrow(
        'Estoque insuficiente para Cupcake.',
      );
      expect(manager.decrement).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('não baixa nenhum item se um dos produtos não tiver estoque', async () => {
      manager.find.mockResolvedValue([
        makeProduct(),
        makeProduct({ id: 'product-2', name: 'Brigadeiro', stock: 0 }),
      ]);

      await expect(
        service.create(COMPANY_ID, USER_ID, {
          ...dto,
          items: [
            { productId: 'product-1', quantity: 1 },
            { productId: 'product-2', quantity: 1 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(manager.decrement).not.toHaveBeenCalled();
    });

    it('produto de outra empresa ou inativo devolve 404', async () => {
      manager.find.mockResolvedValue([]);

      await expect(service.create(COMPANY_ID, USER_ID, dto)).rejects.toThrow(NotFoundException);
      expect(manager.decrement).not.toHaveBeenCalled();
    });

    it('recusa desconto maior que o subtotal', async () => {
      manager.find.mockResolvedValue([makeProduct()]);

      await expect(
        service.create(COMPANY_ID, USER_ID, { ...dto, discount: 16.01 }),
      ).rejects.toThrow('O desconto não pode ser maior que o subtotal.');
      expect(manager.decrement).not.toHaveBeenCalled();
    });

    it('usa desconto zero quando não for informado', async () => {
      manager.find.mockResolvedValue([makeProduct()]);

      const sale = await service.create(COMPANY_ID, USER_ID, { ...dto, discount: undefined });

      expect(sale).toMatchObject({ discount: 0, total: 16 });
    });
  });

  describe('remove', () => {
    it('exclui a venda e devolve o estoque dos itens na transação', async () => {
      manager.findOne.mockResolvedValue(makeSale());
      manager.find.mockResolvedValue([
        makeItem(),
        makeItem({ id: 'item-2', productId: 'product-2', quantity: 3 }),
      ]);

      await service.remove(COMPANY_ID, 'sale-1');

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(manager.findOne.mock.calls[0][1].where).toEqual({
        id: 'sale-1',
        companyId: COMPANY_ID,
      });
      expect(manager.increment).toHaveBeenCalledWith(
        Product,
        { id: 'product-1', companyId: COMPANY_ID },
        'stock',
        2,
      );
      expect(manager.increment).toHaveBeenCalledWith(
        Product,
        { id: 'product-2', companyId: COMPANY_ID },
        'stock',
        3,
      );
      expect(manager.delete).toHaveBeenCalledWith(Sale, { id: 'sale-1', companyId: COMPANY_ID });
    });

    it('venda de outra empresa devolve 404 sem mexer no estoque', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.remove(COMPANY_ID, 'x')).rejects.toThrow(NotFoundException);
      expect(manager.increment).not.toHaveBeenCalled();
      expect(manager.delete).not.toHaveBeenCalled();
    });
  });
});
