import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';

import { Company } from '../../companies/entities/company.entity';

import { User } from '../../users/entities/user.entity';

@Entity('expenses')
@Check('CHK_expenses_amount', '"amount" > 0')
@Index('IDX_expenses_company_date', ['companyId', 'date'])
export class Expense {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_expenses' })
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'FK_expenses_company_id' })
  company?: Company;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_id', foreignKeyConstraintName: 'FK_expenses_created_by_id' })
  createdBy?: User;

  @Column({ type: 'varchar', length: 160 })
  description!: string;

  @Column({ type: 'varchar', length: 80 })
  category!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'boolean' })
  recurring!: boolean;
}
