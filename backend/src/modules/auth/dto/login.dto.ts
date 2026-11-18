import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  toTrimmedLowercase,
  USERNAME_MAX_LENGTH,
} from '../../../common/validation/patterns';

export class LoginDto {
  /** Código da empresa. Omitido apenas no login de super admin. */
  @IsOptional()
  @Transform(toTrimmedLowercase)
  @IsString({ message: 'O código da empresa deve ser um texto.' })
  @MaxLength(60, { message: 'O código da empresa deve ter no máximo 60 caracteres.' })
  companySlug?: string;

  @Transform(toTrimmedLowercase)
  @IsString({ message: 'O usuário deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o usuário.' })
  @MaxLength(USERNAME_MAX_LENGTH, {
    message: `O usuário deve ter no máximo ${USERNAME_MAX_LENGTH} caracteres.`,
  })
  username!: string;

  @IsString({ message: 'A senha deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe a senha.' })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
  })
  password!: string;
}
