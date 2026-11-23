import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from './payment-method.enum';
import { SaleItem } from './sale-item.entity';

@Entity('sales')
@Index('IDX_sales_company_date', ['companyId', 'date'])
@Check('CHK_sales_discount', '"discount" >= 0 AND "discount" <= "subtotal"')
@Check('CHK_sales_total', '"total" >= 0')
export class Sale {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_sales' })
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'FK_sales_company' })
  company?: Company;

  /** Usuário que registrou a venda. */
  @Column({ name: 'created_by', type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'FK_sales_created_by' })
  createdBy?: User;

  /** Data da venda, sem hora (`AAAA-MM-DD`). */
  @Column({ name: 'sale_date', type: 'date' })
  date!: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    enumName: 'sale_payment_method',
  })
  paymentMethod!: PaymentMethod;

  /** Soma dos itens, em reais. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  subtotal!: number;

  /** Desconto em reais. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  discount!: number;

  /** Subtotal menos desconto, em reais. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  total!: number;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: ['insert'] })
  items!: SaleItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
