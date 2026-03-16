import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as log from 'loglevel';
import * as process from 'node:process';
import {json} from "express";

async function bootstrap() {
  log.setLevel('debug');
  const app = await NestFactory.create(AppModule, { cors: true });

  const port = process.env.PORT || 5000;
  const apiUrl = process.env.API_URL || `http://localhost:${port.toString()}`;
  console.log("PORT", port);

  // ✅ Important: bind to 0.0.0.0 (required for Cloud Run)
  await app.listen(port, '0.0.0.0');

  log.setLevel('debug');
  log.info(`🚀 REST API is running on: ${apiUrl}`);
}
bootstrap();
