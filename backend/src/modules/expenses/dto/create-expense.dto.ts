import { Transform } from 'class-transformer';
import { IsBoolean, IsISO8601, IsNumber, IsString, Length, Matches, Max, Min } from 'class-validator';
import { toTrimmed } from '../../../common/validation/patterns';
import { MAX_MONEY } from '../../products/dto/create-product.dto';

export class CreateExpenseDto {
  @Transform(toTrimmed)
  @IsString({ message: 'Informe a descrição da despesa.' })
  @Length(1, 160, { message: 'A descrição deve ter entre 1 e 160 caracteres.' })
  description!: string;

  @Transform(toTrimmed)
  @IsString({ message: 'Informe a categoria.' })
  @Length(1, 80, { message: 'A categoria deve ter entre 1 e 80 caracteres.' })
  category!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Informe um valor com até duas casas decimais.' })
  @Min(0.01, { message: 'Informe um valor maior que zero.' })
  @Max(MAX_MONEY, { message: 'O valor excede o máximo permitido.' })
  amount!: number;

  @Matches(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, { message: 'Informe a data no formato AAAA-MM-DD.' })
  @IsISO8601({ strict: true }, { message: 'Informe uma data válida.' })
  date!: string;

  @IsBoolean({ message: 'Informe se a despesa é recorrente.' })
  recurring!: boolean;
}
