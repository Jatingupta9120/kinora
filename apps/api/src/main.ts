import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  // Browser-side calls (type-ahead) come from the web app; everything authenticated goes server-to-server.
  app.enableCors({ origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',') });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
