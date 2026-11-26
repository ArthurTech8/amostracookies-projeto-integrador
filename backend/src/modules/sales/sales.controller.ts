import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { requireCompanyId } from '../../common/utils/require-company-id';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './entities/sale.entity';
import { SalesService } from './sales.service';

const uuidPipe = new ParseUUIDPipe({ errorHttpStatusCode: 404 });

/** Vendas da empresa do token. Admins e colaboradores registram; só admins excluem. */
@ApiTags('sales')
@ApiBearerAuth()
@Roles(UserRole.Admin, UserRole.Staff)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<Sale[]> {
    return this.salesService.findAll(requireCompanyId(user));
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', uuidPipe) id: string): Promise<Sale> {
    return this.salesService.findOne(requireCompanyId(user), id);
  }

  /** Registra a venda e baixa o estoque dos produtos. */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSaleDto): Promise<Sale> {
    return this.salesService.create(requireCompanyId(user), user.userId, dto);
  }

  /** Exclui a venda e devolve o estoque dos produtos. */
  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id', uuidPipe) id: string): Promise<void> {
    return this.salesService.remove(requireCompanyId(user), id);
  }
}
