import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Company } from '../../companies/entities/company.entity';

@Entity('products')
@Index('IDX_products_company', ['companyId'])
@Check('CHK_products_cost', '"cost" >= 0')
@Check('CHK_products_price', '"price" > 0')
@Check('CHK_products_stock', '"stock" >= 0')
@Check('CHK_products_min_stock', '"min_stock" >= 0')
export class Product {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_products' })
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'FK_products_company' })
  company?: Company;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ type: 'varchar', length: 60 })
  category!: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  description!: string;

  /** Custo unitário em reais. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  cost!: number;

  /** Preço de venda unitário em reais. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  price!: number;

  /** Unidades disponíveis. */
  @Column({ type: 'integer', default: 0 })
  stock!: number;

  /** Abaixo ou igual a este valor, o produto entra no alerta de estoque. */
  @Column({ name: 'min_stock', type: 'integer', default: 0 })
  minStock!: number;

  /** Produto excluído pelo usuário fica inativo, para preservar o histórico. */
  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
