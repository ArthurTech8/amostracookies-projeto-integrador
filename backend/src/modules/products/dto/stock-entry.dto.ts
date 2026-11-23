import { IsInt, Max, Min } from 'class-validator';
import { MAX_STOCK } from './create-product.dto';

export class StockEntryDto {
  /** Quantidade de unidades que entram no estoque. */
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade deve ser maior que zero.' })
  @Max(MAX_STOCK, { message: 'A quantidade é maior que a permitida.' })
  quantity!: number;
}
