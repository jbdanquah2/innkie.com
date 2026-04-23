import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as log from 'loglevel';
import * as process from 'node:process';

async function bootstrap() {
  log.setLevel('debug');
  const app = await NestFactory.create(AppModule, { cors: true });

  const port = Number(process.env['PORT']) || 5002;
  const apiUrl = process.env['API_URL'] || `http://localhost:${port}`;
  
  console.log(`[Bootstrap] Server starting on port: ${port}`);
  console.log(`[Bootstrap] API URL configured as: ${apiUrl}`);

  // ✅ Important: bind to 0.0.0.0 (required for Cloud Run)
  await app.listen(port, '0.0.0.0');

  log.info(`🚀 REST API is running on: ${apiUrl}`);
}
bootstrap();
