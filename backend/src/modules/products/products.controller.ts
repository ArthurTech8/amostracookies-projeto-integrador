import {
  Body,
  Controller,
  Delete,
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
  findAll(@CurrentUser() user: AuthUser): Promise<Product[]> {
    return this.productsService.findAll(requireCompanyId(user));
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id', uuidPipe) id: string): Promise<Product> {
    return this.productsService.findOne(requireCompanyId(user), id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(requireCompanyId(user), dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', uuidPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(requireCompanyId(user), id, dto);
  }

  /** Desativa o produto (não apaga do banco). */
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', uuidPipe) id: string): Promise<Product> {
    return this.productsService.deactivate(requireCompanyId(user), id);
  }

  /** Entrada de estoque: soma `quantity` unidades ao produto. */
  @Post(':id/stock-entries')
  @HttpCode(HttpStatus.OK)
  addStock(
    @CurrentUser() user: AuthUser,
    @Param('id', uuidPipe) id: string,
    @Body() dto: StockEntryDto,
  ): Promise<Product> {
    return this.productsService.addStock(requireCompanyId(user), id, dto.quantity);
  }
}
