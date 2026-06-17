import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { OtpService } from './otp.service';

@Module({
  providers: [CommonService, OtpService],
  exports: [CommonService, OtpService],
})
export class CommonModule {}
