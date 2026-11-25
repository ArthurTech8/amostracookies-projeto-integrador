import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { requireCompanyId } from '../../common/utils/require-company-id';
import { UserRole } from '../users/entities/user-role.enum';
import { AccessService } from './access.service';
import { RequestAccessDto, ResolveAccessDto, SetAccessDto } from './dto/access.dto';

@ApiTags('access')
@ApiBearerAuth()
@Controller('access')
export class AccessController {
  constructor(private readonly access: AccessService) {}

  @Post('requests')
  @Roles(UserRole.Staff)
  @HttpCode(204)
  request(@CurrentUser() user: AuthUser, @Body() dto: RequestAccessDto) {
    return this.access.request(requireCompanyId(user), user.userId, dto);
  }

  @Get('requests')
  @Roles(UserRole.Admin)
  list(@CurrentUser() user: AuthUser) {
    return this.access.list(requireCompanyId(user));
  }

  @Patch('requests/:id')
  @Roles(UserRole.Admin)
  @HttpCode(204)
  resolve(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveAccessDto) {
    return this.access.resolve(requireCompanyId(user), id, dto.approved);
  }

  @Patch('staff/:id')
  @Roles(UserRole.Admin)
  @HttpCode(204)
  set(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SetAccessDto) {
    return this.access.set(requireCompanyId(user), id, dto);
  }
}
