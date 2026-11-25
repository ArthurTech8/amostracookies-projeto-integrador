import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { AccessModule } from '../../../common/decorators/module-access.decorator';

import { Company } from '../../companies/entities/company.entity';

import { User } from '../../users/entities/user.entity';

@Entity('access_requests')
@Index('UQ_access_request_pending', ['companyId', 'userId', 'module'], {
  unique: true,
  where: `"status" = 'pending'`,
})
export class AccessRequest {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_access_requests' })
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'company_id', foreignKeyConstraintName: 'FK_access_requests_company_id' })
  company?: Company;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_access_requests_user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 20 })
  module!: AccessModule;

  @Column({ type: 'varchar', length: 10, default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
