import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { FirebaseService } from '../../services/firebase.service';

@Injectable()
export class OptionalFirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebase: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true; // Proceed without user
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await this.firebase.auth.verifyIdToken(idToken);
      request['user'] = decodedToken;
    } catch (error) {
      // If token is invalid, we still allow the request but without a user
      console.warn('Optional Auth: Invalid token provided');
    }

    return true;
  }
}
