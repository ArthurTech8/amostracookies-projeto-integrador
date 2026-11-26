import type { ValueTransformer } from 'typeorm';

/**
 * Colunas `numeric` chegam do PostgreSQL como texto para não perder precisão.
 * Este transformer devolve `number` para a API (valores com no máximo 2 casas).
 */
export const decimalTransformer: ValueTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | null): number | null => (value === null ? null : Number(value)),
};
