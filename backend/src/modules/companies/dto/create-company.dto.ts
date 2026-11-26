import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  SLUG_PATTERN,
  toTrimmed,
  toTrimmedLowercase,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../../../common/validation/patterns';

/** Primeiro administrador, criado junto com a empresa. */
export class CreateCompanyAdminDto {
  @Transform(toTrimmed)
  @IsString({ message: 'O nome do administrador deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome do administrador.' })
  @Length(2, 120, { message: 'O nome do administrador deve ter entre 2 e 120 caracteres.' })
  name!: string;

  @Transform(toTrimmedLowercase)
  @IsString({ message: 'O usuário do administrador deve ser um texto.' })
  @Length(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, {
    message: `O usuário do administrador deve ter entre ${USERNAME_MIN_LENGTH} e ${USERNAME_MAX_LENGTH} caracteres.`,
  })
  @Matches(USERNAME_PATTERN, {
    message: 'O usuário só pode ter letras minúsculas, números, ponto, hífen e sublinhado.',
  })
  username!: string;

  @IsString({ message: 'A senha do administrador deve ser um texto.' })
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: `A senha do administrador deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`,
  })
  password!: string;
}

export class CreateCompanyDto {
  @Transform(toTrimmed)
  @IsString({ message: 'O nome da empresa deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome da empresa.' })
  @Length(2, 120, { message: 'O nome da empresa deve ter entre 2 e 120 caracteres.' })
  name!: string;

  /** Código da empresa usado no login (ex.: `doce-da-ana`). Não pode ser alterado depois. */
  @Transform(toTrimmedLowercase)
  @IsString({ message: 'O código da empresa deve ser um texto.' })
  @Length(2, 60, { message: 'O código da empresa deve ter entre 2 e 60 caracteres.' })
  @Matches(SLUG_PATTERN, {
    message: 'O código da empresa só pode ter letras minúsculas, números e hífens.',
  })
  slug!: string;

  @IsNotEmptyObject({}, { message: 'Informe os dados do primeiro administrador.' })
  @ValidateNested()
  @Type(() => CreateCompanyAdminDto)
  admin!: CreateCompanyAdminDto;
}
