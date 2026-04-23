import { Controller, Get } from '@nestjs/common';
import {FirebaseService} from './services/firebase.service';

@Controller()
export class AppController {
  constructor(private firestore: FirebaseService) {}

  @Get()
  async getHello(): Promise<any> {
    return ('Welcome to iNNkie URL shortener!');
  }

  @Get('api/health')
  async healthCheck(): Promise<any> {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
