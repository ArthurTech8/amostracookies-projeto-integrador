import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { toTrimmed } from '../../../common/validation/patterns';

/** O código da empresa (slug) não pode ser alterado. */
export class UpdateCompanyDto {
  @IsOptional()
  @Transform(toTrimmed)
  @IsString({ message: 'O nome da empresa deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome da empresa.' })
  @Length(2, 120, { message: 'O nome da empresa deve ter entre 2 e 120 caracteres.' })
  name?: string;

  @IsOptional()
  @IsBoolean({ message: 'O campo active deve ser verdadeiro ou falso.' })
  active?: boolean;
}
