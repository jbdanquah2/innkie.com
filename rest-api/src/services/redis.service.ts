import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis | null = null;
  private isEnabled = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not provided. Redis caching is DISABLED.');
      return;
    }

    this.logger.log(`Initializing Redis connection to ${redisUrl}`);
    
    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error('Redis connection failed after 3 attempts. Disabling Redis.');
            this.isEnabled = false;
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redisClient.on('error', (err) => {
        this.logger.error('Redis error', err.message);
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis connected successfully');
        this.isEnabled = true;
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis client', error);
      this.isEnabled = false;
    }
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.quit();
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isEnabled || !this.redisClient) return null;
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isEnabled || !this.redisClient) return;
    try {
      if (ttlSeconds) {
        await this.redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      // Ignore set errors
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isEnabled || !this.redisClient) return;
    try {
      await this.redisClient.del(key);
    } catch (error) {
      // Ignore del errors
    }
  }
}
