import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi'; // optional, for validation
import { AppController } from './app.controller';
import {FirebaseService} from './services/firebase.service';
import {ShortenUrlController} from './url/shorten-url.controller';
import {ShortenUrlService} from './services/shorten-url.service';
import { CreateCustomJwtController } from './auth/create-custom-jwt.controller';
import { ApplyCustomClaimsController } from './auth/apply-custom-claims.controller';
import { RedirectToLongUrlController } from './url/redirect-to-long-url.controller';
import { LongUrlPreviewController } from './url/long-url-preview.controller';
import { LongUrlPreviewService } from './services/long-url-preview.service';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService available everywhere
      envFilePath: '.env', // default is .env in project root, can be overridden
      validationSchema: Joi.object({
        SERVICE_ACCOUNT_FILE_NAME: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }), // validation prevents missing or invalid envs
    }),
  ],
  controllers: [
    AppController,
    ShortenUrlController,
    CreateCustomJwtController,
    ApplyCustomClaimsController,
    RedirectToLongUrlController,
    LongUrlPreviewController
  ],
  providers: [
    FirebaseService,
    ShortenUrlService,
    LongUrlPreviewService
  ],
})
export class AppModule {}
