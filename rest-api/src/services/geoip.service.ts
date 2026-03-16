import { Injectable, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';
import * as maxmind from 'maxmind';
import * as log from 'loglevel';

@Injectable()
export class GeoIpService implements OnModuleInit {
  private lookup: maxmind.Reader<maxmind.CityResponse> | null = null;
  private readonly dbPath = join(process.cwd(), 'geo-data', 'GeoLite2-City.mmdb');

  async onModuleInit() {
    await this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      if (existsSync(this.dbPath)) {
        this.lookup = await maxmind.open<maxmind.CityResponse>(this.dbPath);
        log.info('✅ GeoIP Service: Local MaxMind database initialized.');
      } else {
        log.warn(`⚠️ GeoIP Service: Database not found at ${this.dbPath}. Falling back to external API.`);
      }
    } catch (error) {
      log.error('❌ GeoIP Service: Failed to initialize local database:', error);
    }
  }

  getLocation(ip: string): { country: string; city: string } | null {
    if (!this.lookup) return null;

    const result = this.lookup.get(ip);
    if (!result) return null;

    return {
      country: result.country?.names?.en || result.registered_country?.names?.en || 'Unknown',
      city: result.city?.names?.en || 'Unknown'
    };
  }
}
