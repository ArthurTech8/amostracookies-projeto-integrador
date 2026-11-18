import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_companies' })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  /** Código da empresa usado no login. Minúsculo, `[a-z0-9-]`, imutável. */
  @Index('UQ_companies_slug', { unique: true })
  @Column({ type: 'varchar', length: 60 })
  slug!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
