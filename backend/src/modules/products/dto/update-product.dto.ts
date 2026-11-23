import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/** Todos os campos são opcionais; só os enviados são alterados. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
