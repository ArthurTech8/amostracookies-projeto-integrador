import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { hashPassword } from '../../common/utils/password';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { toUserResponse, type UserResponse } from '../users/user-response';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';

const DUPLICATE_SLUG = 'Já existe uma empresa com este código.';
const PG_UNIQUE_VIOLATION = '23505';

export interface CompanyWithAdmin extends Company {
  admin: UserResponse;
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError: unknown = error.driverError;
  return (
    typeof driverError === 'object' &&
    driverError !== null &&
    'code' in driverError &&
    driverError.code === PG_UNIQUE_VIOLATION
  );
}

/** Empresas (tenants). Usado apenas por super admins. */
@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private readonly companiesRepository: Repository<Company>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Cria a empresa e o primeiro administrador na mesma transação. */
  async create(dto: CreateCompanyDto): Promise<CompanyWithAdmin> {
    if (await this.companiesRepository.exists({ where: { slug: dto.slug } })) {
      throw new ConflictException(DUPLICATE_SLUG);
    }

    const passwordHash = await hashPassword(dto.admin.password);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const company = await manager.save(
          manager.create(Company, { name: dto.name, slug: dto.slug, active: true }),
        );
        const admin = await manager.save(
          manager.create(User, {
            companyId: company.id,
            name: dto.admin.name,
            username: dto.admin.username,
            passwordHash,
            role: UserRole.Admin,
            active: true,
          }),
        );
        return { ...company, admin: toUserResponse(admin) };
      });
    } catch (error) {
      // Outra requisição criou o mesmo código entre a verificação e a gravação.
      if (isUniqueViolation(error)) throw new ConflictException(DUPLICATE_SLUG);
      throw error;
    }
  }

  findAll(): Promise<Company[]> {
    return this.companiesRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companiesRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Empresa não encontrada.');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);
    if (dto.name !== undefined) company.name = dto.name;
    if (dto.active !== undefined) company.active = dto.active;
    return this.companiesRepository.save(company);
  }
}
