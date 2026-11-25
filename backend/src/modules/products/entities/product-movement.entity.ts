import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export type ProductAction = 'created' | 'updated' | 'deactivated' | 'stock_entry';

import { Company } from '../../companies/entities/company.entity';

import { User } from '../../users/entities/user.entity';

import { Product } from './product.entity';

@Entity('product_movements')
@Index('IDX_product_movements_company_date', ['companyId', 'createdAt'])
export class ProductMovement {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_product_movements' })
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'FK_product_movements_company_id' })
  company?: Company;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_product_movements_user_id' })
  user?: User;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_product_movements_product_id' })
  product?: Product;

  @Column({ name: 'product_name', type: 'varchar', length: 80 })
  productName!: string;

  @Column({ type: 'varchar', length: 20 })
  action!: ProductAction;

  @Column({ name: 'stock_delta', type: 'integer', nullable: true })
  stockDelta!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
