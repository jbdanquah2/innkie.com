// src/controllers/apply-custom-claims.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common';
import { FirebaseService } from '../services/firebase.service';
import * as log from 'loglevel';

@Controller('api')
export class ApplyCustomClaimsController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post('apply-custom-claims')
  async applyCustomClaims(@Body('idToken') idToken: string, @Res() res: any,) {

    log.debug('Called applyCustomClaims with idToken:', idToken);

    if (!idToken) {
      return res.status(400).json({ error: 'ID Token is required' });
    }

    try {

      log.debug("Verifying the ID token.....")

      const decoded = await this.firebaseService.auth.verifyIdToken(idToken);
      const userId = decoded.uid;
      const userData = await this.firebaseService.getDocData(`users/${userId}`);
      const role = userData?.role ?? 'isAdmin';
      const permissions = userData?.permissions ?? [];

      log.debug("Setting custom claims.....")

      await this.firebaseService.auth.setCustomUserClaims(userId, {
        role,
        permissions,
      });

      log.debug("Custom claims applied successfully.....")

      return res.status(200).json({
        message: 'Claims applied successfully. Please refresh your token.',
      });
    } catch (error) {
      log.debug('Error applying custom claims:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}
