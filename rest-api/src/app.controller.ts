import { Controller, Get } from '@nestjs/common';
import {FirebaseService} from './services/firebase.service';

@Controller()
export class AppController {
  constructor(private firestore: FirebaseService) {}

  @Get()
  async getHello(): Promise<any> {
    return ('Welcome to iNNkie URL shortener!');
  }
}
