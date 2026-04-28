import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { FirebaseService } from './services/firebase.service';


describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: FirebaseService,
          useValue: {}, // Mock FirebaseService
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Welcome to iNNkie URL shortener!"', async () => {
      expect(await appController.getHello()).toBe('Welcome to iNNkie URL shortener!');
    });
  });
});
