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
import { Company } from '../../companies/entities/company.entity';
import { UserRole } from './user-role.enum';

@Entity('users')
@Index('UQ_users_company_username', ['companyId', 'username'], {
  unique: true,
  where: '"company_id" IS NOT NULL',
})
@Index('UQ_users_platform_username', ['username'], {
  unique: true,
  where: '"company_id" IS NULL',
})
@Check('CHK_users_super_admin_company', `("role" = 'super_admin') = ("company_id" IS NULL)`)
export class User {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_users' })
  id!: string;

  /** Nulo apenas para super admins. */
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'FK_users_company' })
  company?: Company | null;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  /** Sempre salvo em minúsculas. */
  @Column({ type: 'varchar', length: 60 })
  username!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 100, select: false })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
