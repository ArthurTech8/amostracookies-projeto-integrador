import { existsSync } from 'node:fs';

/**
 * Arquivos .env lidos, em ordem de prioridade: primeiro o do backend,
 * depois o da raiz do repositório. Variáveis já definidas no ambiente nunca são sobrescritas.
 */
export const ENV_FILE_PATHS = ['.env', '../.env'];

/** Carrega os arquivos .env para scripts fora do Nest (CLI do TypeORM e seeds). */
export function loadEnvFiles(): void {
  for (const path of ENV_FILE_PATHS) {
    if (existsSync(path)) process.loadEnvFile(path);
  }
}
