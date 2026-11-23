import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { toTrimmed } from '../../../common/validation/patterns';

/** Maior valor que cabe em `numeric(12,2)`. */
export const MAX_MONEY = 9_999_999_999.99;
export const MAX_STOCK = 1_000_000;

export class CreateProductDto {
  @Transform(toTrimmed)
  @IsString({ message: 'O nome do produto deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe o nome do produto.' })
  @Length(2, 80, { message: 'O nome do produto deve ter entre 2 e 80 caracteres.' })
  name!: string;

  @Transform(toTrimmed)
  @IsString({ message: 'A categoria deve ser um texto.' })
  @IsNotEmpty({ message: 'Informe a categoria.' })
  @MaxLength(60, { message: 'A categoria deve ter no máximo 60 caracteres.' })
  category!: string;

  @IsOptional()
  @Transform(toTrimmed)
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(500, { message: 'A descrição deve ter no máximo 500 caracteres.' })
  description?: string;

  /** Custo unitário em reais, com até 2 casas decimais. */
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'O custo deve ser um número com até 2 casas decimais.' },
  )
  @Min(0, { message: 'O custo não pode ser negativo.' })
  @Max(MAX_MONEY, { message: 'O custo é maior que o permitido.' })
  cost!: number;

  /** Preço de venda em reais, com até 2 casas decimais. */
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'O preço deve ser um número com até 2 casas decimais.' },
  )
  @Min(0.01, { message: 'O preço de venda deve ser maior que zero.' })
  @Max(MAX_MONEY, { message: 'O preço é maior que o permitido.' })
  price!: number;

  /** Estoque inicial em unidades. Padrão: 0. */
  @IsOptional()
  @IsInt({ message: 'O estoque deve ser um número inteiro.' })
  @Min(0, { message: 'O estoque não pode ser negativo.' })
  @Max(MAX_STOCK, { message: 'O estoque é maior que o permitido.' })
  stock?: number;

  /** Alerta de estoque mínimo. Padrão: 0. */
  @IsOptional()
  @IsInt({ message: 'O estoque mínimo deve ser um número inteiro.' })
  @Min(0, { message: 'O estoque mínimo não pode ser negativo.' })
  @Max(MAX_STOCK, { message: 'O estoque mínimo é maior que o permitido.' })
  minStock?: number;

  /** Padrão: true. */
  @IsOptional()
  @IsBoolean({ message: 'O campo active deve ser verdadeiro ou falso.' })
  active?: boolean;
}
