import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  toTrimmed,
  toTrimmedLowercase,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../../../common/validation/patterns';
import { COMPANY_ROLES, type CompanyRole } from '../entities/user-role.enum';

export class CreateUserDto {
  /** Nome de exibição. */
  @Transform(toTrimmed)
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome.' })
  @Length(2, 120, { message: 'O nome deve ter entre 2 e 120 caracteres.' })
  name!: string;

  /** Usuário de login, único dentro da empresa. Salvo em minúsculas. */
  @Transform(toTrimmedLowercase)
  @IsString({ message: 'O usuário deve ser um texto.' })
  @Length(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, {
    message: `O usuário deve ter entre ${USERNAME_MIN_LENGTH} e ${USERNAME_MAX_LENGTH} caracteres.`,
  })
  @Matches(USERNAME_PATTERN, {
    message: 'O usuário só pode ter letras minúsculas, números, ponto, hífen e sublinhado.',
  })
  username!: string;

  @IsString({ message: 'A senha deve ser um texto.' })
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: `A senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`,
  })
  password!: string;

  /** `admin` ou `staff`. */
  @IsIn(COMPANY_ROLES, { message: 'O papel deve ser admin ou staff.' })
  role!: CompanyRole;
}
