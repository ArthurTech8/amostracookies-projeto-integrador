import { IsBoolean, IsIn } from 'class-validator';
import { ACCESS_MODULES, type AccessModule } from '../../../common/decorators/module-access.decorator';

export class RequestAccessDto {
  @IsIn(ACCESS_MODULES, { message: 'Selecione um módulo válido.' })
  module!: AccessModule;
}

export class SetAccessDto extends RequestAccessDto {
  @IsIn(['none', 'view', 'operate'], { message: 'Selecione um nível de acesso válido.' })
  level!: 'none' | 'view' | 'operate';
}

export class ResolveAccessDto {
  @IsBoolean({ message: 'Informe se a solicitação foi aprovada.' })
  approved!: boolean;
}
