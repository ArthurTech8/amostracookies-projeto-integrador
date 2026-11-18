/** Código da empresa: minúsculas, números e hífens (ex.: `doce-da-ana`). */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Nome de usuário: minúsculas, números, ponto, hífen e sublinhado. */
export const USERNAME_PATTERN = /^[a-z0-9._-]+$/;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 60;
export const PASSWORD_MIN_LENGTH = 8;
/** O bcrypt ignora o que passar de 72 bytes. */
export const PASSWORD_MAX_LENGTH = 72;

/** Normaliza textos: remove espaços das pontas e converte para minúsculas. */
export function toTrimmedLowercase({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/** Remove espaços das pontas. */
export function toTrimmed({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
