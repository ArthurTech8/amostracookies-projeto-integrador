import { ValidationPipe, type INestApplication } from '@nestjs/common';

/** Configuração comum à aplicação e aos testes e2e. */
export function setupApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
}
