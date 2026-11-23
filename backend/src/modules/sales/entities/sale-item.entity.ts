import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Product } from '../../products/entities/product.entity';
import { Sale } from './sale.entity';

/** Item de uma venda. Nome, preço e custo são copiados do produto no momento da venda. */
@Entity('sale_items')
@Index('IDX_sale_items_sale', ['saleId'])
@Index('IDX_sale_items_product', ['productId'])
@Check('CHK_sale_items_quantity', '"quantity" > 0')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_sale_items' })
  id!: string;

  @Column({ name: 'sale_id', type: 'uuid' })
  saleId!: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id', foreignKeyConstraintName: 'FK_sale_items_sale' })
  sale?: Sale;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_sale_items_product' })
  product?: Product;

  @Column({ name: 'product_name', type: 'varchar', length: 80 })
  productName!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  /** Preço de venda unitário em reais. */
  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPrice!: number;

  /** Custo unitário em reais. */
  @Column({
    name: 'unit_cost',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitCost!: number;
}
