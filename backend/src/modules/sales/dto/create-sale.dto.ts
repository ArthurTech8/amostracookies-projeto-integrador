import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MAX_MONEY, MAX_STOCK } from '../../products/dto/create-product.dto';
import { PaymentMethod } from '../entities/payment-method.enum';

export const MAX_SALE_ITEMS = 100;

export class CreateSaleItemDto {
  @IsUUID('all', { message: 'Produto inválido.' })
  productId!: string;

  /** Unidades vendidas. */
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @Min(1, { message: 'A quantidade deve ser maior que zero.' })
  @Max(MAX_STOCK, { message: 'A quantidade é maior que a permitida.' })
  quantity!: number;
}

/** O preço e o custo dos itens vêm do cadastro do produto, não da requisição. */
export class CreateSaleDto {
  @IsArray({ message: 'Os itens da venda devem ser uma lista.' })
  @ArrayNotEmpty({ message: 'Adicione pelo menos um produto à venda.' })
  @ArrayMaxSize(MAX_SALE_ITEMS, {
    message: `A venda pode ter no máximo ${MAX_SALE_ITEMS} produtos.`,
  })
  @ArrayUnique((item: CreateSaleItemDto) => item.productId, {
    message: 'Cada produto deve aparecer uma vez só na venda.',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  /** Desconto em reais, com até 2 casas decimais. Padrão: 0. */
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'O desconto deve ser um número com até 2 casas decimais.' },
  )
  @Min(0, { message: 'O desconto não pode ser negativo.' })
  @Max(MAX_MONEY, { message: 'O desconto é maior que o permitido.' })
  discount?: number;

  @IsEnum(PaymentMethod, {
    message: `A forma de pagamento deve ser uma destas: ${Object.values(PaymentMethod).join(', ')}.`,
  })
  paymentMethod!: PaymentMethod;

  /** Data da venda no formato `AAAA-MM-DD`. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Informe a data da venda no formato AAAA-MM-DD.' })
  @IsISO8601({ strict: true }, { message: 'A data da venda é inválida.' })
  date!: string;
}
