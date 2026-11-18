import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types/auth-user';
import { requireCompanyId } from '../../common/utils/require-company-id';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user-role.enum';
import type { UserResponse } from './user-response';
import { UsersService } from './users.service';

/** Usuários da empresa do token. Só administradores da empresa. */
@ApiTags('users')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser): Promise<UserResponse[]> {
    return this.usersService.findAll(requireCompanyId(user));
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto): Promise<UserResponse> {
    return this.usersService.create(requireCompanyId(user), dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: 404 })) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.update(requireCompanyId(user), user.userId, id, dto);
  }
}
