import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ModuleAccess } from '../../common/decorators/module-access.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { requireCompanyId } from '../../common/utils/require-company-id';
import { UserRole } from '../users/entities/user-role.enum';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Roles(UserRole.Admin, UserRole.Staff)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @ModuleAccess('view', 'reports')
  read(@CurrentUser() user: AuthUser) {
    return this.reports.read(requireCompanyId(user));
  }
}
