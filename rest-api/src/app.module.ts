import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi'; // optional, for validation
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import {FirebaseService} from './services/firebase.service';
import {ShortenUrlController} from './url/shorten-url.controller';
import {ShortenUrlService} from './services/shorten-url.service';
import { CreateCustomJwtController } from './auth/create-custom-jwt.controller';
import { ApplyCustomClaimsController } from './auth/apply-custom-claims.controller';
import { RedirectToLongUrlController } from './url/redirect-to-long-url.controller';
import { LongUrlPreviewController } from './url/long-url-preview.controller';
import { LongUrlPreviewService } from './services/long-url-preview.service';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsController } from './url/analytics.controller';
import { GeoIpService } from './services/geoip.service';
import { RedisService } from './services/redis.service';
import { WorkspaceController } from './workspace/workspace.controller';
import { WorkspaceService } from './workspace/workspace.service';
import { ApiKeyService } from './workspace/api-key.service';
import { PublicApiController } from './url/public-api.controller';
import { QrController } from './url/qr.controller';
import { WebhookController } from './url/webhook.controller';
import { QrService } from './services/qr.service';
import { WebhookService } from './services/webhook.service';
import { WebhookDispatcherService } from './services/webhook-dispatcher.service';
import { FirebaseAuthGuard } from './auth/guards/firebase-auth.guard';
import { ApiKeyGuard } from './auth/guards/api-key.guard';
import { LinksController } from './url/links.controller';
import { PlatformMetricsService } from './services/platform-metrics.service';
import { PlatformMetricsController } from './url/platform-metrics.controller';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService available everywhere
      envFilePath: '.env', // default is .env in project root, can be overridden
      validationSchema: Joi.object({
        SERVICE_ACCOUNT_FILE_NAME: Joi.string().optional(),
        PORT: Joi.number().default(3000),
        REDIS_URL: Joi.string().optional(),
        THROTTLE_TTL: Joi.number().default(60000), // 1 minute
        THROTTLE_LIMIT: Joi.number().default(100), // 100 requests
      }),
 // validation prevents missing or invalid envs
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') || 60000,
          limit: config.get<number>('THROTTLE_LIMIT') || 100,
        },
      ],
    }),
  ],
  controllers: [
    AppController,
    ShortenUrlController,
    CreateCustomJwtController,
    ApplyCustomClaimsController,
    RedirectToLongUrlController,
    LongUrlPreviewController,
    AnalyticsController,
    WorkspaceController,
    PublicApiController,
    QrController,
    WebhookController,
    LinksController,
    PlatformMetricsController
  ],
  providers: [
    FirebaseService,
    ShortenUrlService,
    LongUrlPreviewService,
    AnalyticsService,
    GeoIpService,
    RedisService,
    WorkspaceService,
    ApiKeyService,
    QrService,
    WebhookService,
    WebhookDispatcherService,
    FirebaseAuthGuard,
    ApiKeyGuard,
    PlatformMetricsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
