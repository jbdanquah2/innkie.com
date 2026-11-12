import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { FirebaseAuthGuard } from './firebase-auth.guard';

/**
 * For routes that serve both the signed-in web app and API-key clients. An `x-api-key` header selects the API-key
 * path (request.workspace is set); otherwise a Firebase ID token is required (request.user is set).
 */
@Injectable()
export class FirebaseOrApiKeyGuard implements CanActivate {
  constructor(private readonly firebaseGuard: FirebaseAuthGuard, private readonly apiKeyGuard: ApiKeyGuard) {}

  canActivate(context: ExecutionContext): Promise<boolean> | boolean {
    const request = context.switchToHttp().getRequest();
    return request.headers['x-api-key'] !== undefined
      ? this.apiKeyGuard.canActivate(context)
      : this.firebaseGuard.canActivate(context);
  }
}
