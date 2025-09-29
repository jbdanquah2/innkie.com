import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as log from 'loglevel';
import * as process from 'node:process';

const PORT = process.env.PORT || 5000;
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;
const SERVER_URL = `${API_URL}:${PORT}`;

// Set log level globally (trace, debug, info, warn, error, silent)
log.setLevel('debug');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors:true});
  await app.listen(process.env.PORT ?? 5000);
  log.info(`REST API is running on: ${SERVER_URL}`);
}
bootstrap();
