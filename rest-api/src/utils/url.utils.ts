import * as cheerio from 'cheerio';
import crypto from "crypto";


export function hashPassword(password: string, salt: string): string {
  return crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("hex");
}

