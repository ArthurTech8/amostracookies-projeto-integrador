import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user-role.enum';
import { CompaniesService, type CompanyWithAdmin } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';

/** Gestão de empresas. Só super admins da plataforma. */
@ApiTags('companies')
@ApiBearerAuth()
@Roles(UserRole.SuperAdmin)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() dto: CreateCompanyDto): Promise<CompanyWithAdmin> {
    return this.companiesService.create(dto);
  }

  @Get()
  findAll(): Promise<Company[]> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
  ): Promise<Company> {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<Company> {
    return this.companiesService.update(id, dto);
  }
}
