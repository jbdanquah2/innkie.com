// src/controllers/create-custom-jwt.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common';
import { FirebaseService } from '../services/firebase.service';

@Controller('api')
export class CreateCustomJwtController {
  constructor(private readonly firebase: FirebaseService) {}

  @Post('create-custom-jwt')
  async createCustomJwt(@Body('userId') userId: string, @Res() res:any) {


    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {

      const user = await this.firebase.getDocData(`users/${userId}`);


      const token = await this.firebase.auth.createCustomToken(userId, {
        isAdmin: true,
        ...user
      });

      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
