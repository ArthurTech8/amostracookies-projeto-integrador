import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ModuleAccess } from '../../common/decorators/module-access.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { requireCompanyId } from '../../common/utils/require-company-id';
import { UserRole } from '../users/entities/user-role.enum';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@ApiBearerAuth()
@Roles(UserRole.Admin, UserRole.Staff)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @ModuleAccess('view', 'expenses')
  list(@CurrentUser() user: AuthUser) {
    return this.expenses.list(requireCompanyId(user));
  }

  @Post()
  @ModuleAccess('operate', 'expenses')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(requireCompanyId(user), user.userId, dto);
  }

  @Delete(':id')
  @ModuleAccess('operate', 'expenses')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.expenses.remove(requireCompanyId(user), id);
  }
}
