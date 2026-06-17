import { Injectable } from '@nestjs/common';

@Injectable()
export class OtpService {
  /**
   * Generate a 6-digit OTP code
   */
  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate OTP expiration date
   * @param minutes - Number of minutes until expiration (default: 5)
   */
  generateOtpExpiration(minutes: number = 5): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}
