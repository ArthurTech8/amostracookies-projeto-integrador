import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ModuleAccess } from '../../common/decorators/module-access.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { requireCompanyId } from '../../common/utils/require-company-id';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { StockEntryDto } from './dto/stock-entry.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

const uuidPipe = new ParseUUIDPipe({ errorHttpStatusCode: 404 });

/** Catálogo e estoque da empresa do token. Admins e colaboradores. */
@ApiTags('products')
@ApiBearerAuth()
@Roles(UserRole.Admin, UserRole.Staff)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ModuleAccess('view', 'products', 'stock')
  findAll(@CurrentUser() user: AuthUser): Promise<Product[]> {
    return this.productsService.findAll(requireCompanyId(user));
  }

  @Get('sale-options')
  @ModuleAccess('operate', 'sales')
  saleOptions(@CurrentUser() user: AuthUser) {
    return this.productsService.saleOptions(requireCompanyId(user));
  }

  @Get('movements')
  @Roles(UserRole.Admin)
  listMovements(@CurrentUser() user: AuthUser) {
    return this.productsService.listMovements(requireCompanyId(user));
  }

  @Get(':id')
  @ModuleAccess('view', 'products', 'stock')
  findOne(@CurrentUser() user: AuthUser, @Param('id', uuidPipe) id: string): Promise<Product> {
    return this.productsService.findOne(requireCompanyId(user), id);
  }

  @Post()
  @ModuleAccess('operate', 'products')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto): Promise<Product> {
    this.checkStockWrite(user, dto.stock !== undefined || dto.minStock !== undefined);
    return this.productsService.create(requireCompanyId(user), user.userId, dto);
  }

  @Patch(':id')
  @ModuleAccess('operate', 'products')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    this.checkStockWrite(user, dto.stock !== undefined || dto.minStock !== undefined);
    return this.productsService.update(requireCompanyId(user), user.userId, id, dto);
  }

  // O formulário de cadastro também pode alterar campos de estoque.
  private checkStockWrite(user: AuthUser, changesStock: boolean) {
    if (changesStock && user.role !== UserRole.Admin && user.permissions?.stock !== 'operate') {
      throw new ForbiddenException('Você não tem permissão para alterar o estoque.');
    }
  }

  /** Desativa o produto (não apaga do banco). */
  @Delete(':id')
  @ModuleAccess('operate', 'products')
  remove(@CurrentUser() user: AuthUser, @Param('id', uuidPipe) id: string): Promise<Product> {
    return this.productsService.deactivate(requireCompanyId(user), user.userId, id);
  }

  /** Entrada de estoque: soma `quantity` unidades ao produto. */
  @Post(':id/stock-entries')
  @ModuleAccess('operate', 'stock')
  @HttpCode(HttpStatus.OK)
  addStock(
    @CurrentUser() user: AuthUser,
    @Param('id', uuidPipe) id: string,
    @Body() dto: StockEntryDto,
  ): Promise<Product> {
    return this.productsService.addStock(requireCompanyId(user), user.userId, id, dto.quantity);
  }
}
