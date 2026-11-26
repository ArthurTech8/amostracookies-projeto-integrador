const DURATION_PATTERN = /^(\d+)(s|m|h|d)$/;
const DURATION_UNITS_IN_SECONDS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

export interface Env {
  NODE_ENV: string;
  DATABASE_URL: string;
  DB_SSL: boolean;
  JWT_SECRET: string;
  JWT_EXPIRES_IN_SECONDS: number;
  PORT: number;
  CORS_ORIGINS: string[];
}

export class EnvValidationError extends Error {}

function readString(raw: Record<string, unknown>, key: string): string | undefined {
  const value = raw[key];
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return undefined;
  }
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function requireString(raw: Record<string, unknown>, key: string, errors: string[]): string {
  const value = readString(raw, key);
  if (value === undefined) errors.push(`${key} é obrigatória.`);
  return value ?? '';
}

export function parseDurationToSeconds(value: string): number | null {
  const match = DURATION_PATTERN.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  const seconds = amount * DURATION_UNITS_IN_SECONDS[match[2]];
  return seconds > 0 ? seconds : null;
}

/** Valida as variáveis de ambiente e devolve a configuração já tipada. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const errors: string[] = [];

  const databaseUrl = requireString(raw, 'DATABASE_URL', errors);
  if (databaseUrl && !/^postgres(ql)?:\/\//.test(databaseUrl)) {
    errors.push('DATABASE_URL deve começar com postgresql://.');
  }

  const dbSsl = readString(raw, 'DB_SSL') ?? 'false';
  if (dbSsl !== 'true' && dbSsl !== 'false') errors.push('DB_SSL deve ser true ou false.');

  const jwtSecret = requireString(raw, 'JWT_SECRET', errors);
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push('JWT_SECRET deve ter pelo menos 32 caracteres.');
  }

  const expiresIn = readString(raw, 'JWT_EXPIRES_IN') ?? '8h';
  const expiresInSeconds = parseDurationToSeconds(expiresIn);
  if (expiresInSeconds === null) {
    errors.push('JWT_EXPIRES_IN deve ser um número seguido de s, m, h ou d (ex.: 8h).');
  }

  const port = Number(readString(raw, 'PORT') ?? '3000');
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    errors.push('PORT deve ser um número de porta válido.');
  }

  const corsOrigins = (readString(raw, 'CORS_ORIGIN') ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');

  if (errors.length > 0) {
    throw new EnvValidationError(`Configuração de ambiente inválida:\n- ${errors.join('\n- ')}`);
  }

  return {
    NODE_ENV: readString(raw, 'NODE_ENV') ?? 'development',
    DATABASE_URL: databaseUrl,
    DB_SSL: dbSsl === 'true',
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN_SECONDS: expiresInSeconds ?? 0,
    PORT: port,
    CORS_ORIGINS: corsOrigins,
  };
}
