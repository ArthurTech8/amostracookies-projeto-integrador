import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  toTrimmed,
} from '../../../common/validation/patterns';
import { COMPANY_ROLES, type CompanyRole } from '../entities/user-role.enum';

/** O nome de usuário não pode ser alterado. */
export class UpdateUserDto {
  @IsOptional()
  @Transform(toTrimmed)
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome.' })
  @Length(2, 120, { message: 'O nome deve ter entre 2 e 120 caracteres.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'A senha deve ser um texto.' })
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: `A senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`,
  })
  password?: string;

  @IsOptional()
  @IsIn(COMPANY_ROLES, { message: 'O papel deve ser admin ou staff.' })
  role?: CompanyRole;

  @IsOptional()
  @IsBoolean({ message: 'O campo active deve ser verdadeiro ou falso.' })
  active?: boolean;
}
