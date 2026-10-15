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
// No top-level await: Vercel's launcher waits for this module to finish loading before it
// serves, so awaiting listen() here would deadlock the function at startup.
bootstrap().catch((err: unknown) => {
  console.error('Failed to start Kinora API', err);
  process.exit(1);
});
