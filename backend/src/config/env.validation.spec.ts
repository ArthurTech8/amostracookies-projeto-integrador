import { EnvValidationError, parseDurationToSeconds, validateEnv } from './env.validation';

const VALID = {
  DATABASE_URL: 'postgresql://usuario:senha@host:5432/banco',
  DB_SSL: 'true',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('aplica valores padrão', () => {
    expect(validateEnv(VALID)).toMatchObject({
      DB_SSL: true,
      JWT_EXPIRES_IN_SECONDS: 8 * 3600,
      PORT: 3000,
      CORS_ORIGINS: ['http://localhost:5173'],
    });
  });

  it('lista todos os erros de uma vez', () => {
    expect(() => validateEnv({ JWT_SECRET: 'curto', DB_SSL: 'sim' })).toThrow(EnvValidationError);
  });
});

describe('parseDurationToSeconds', () => {
  it.each([
    ['30m', 1800],
    ['8h', 28800],
    ['1d', 86400],
    ['8 horas', null],
    ['0h', null],
  ])('%s -> %s', (input, expected) => {
    expect(parseDurationToSeconds(input)).toBe(expected);
  });
});
