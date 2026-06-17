import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import {
  RequestOtpReqInput,
  RequestOtpRes,
  VerifyOtpReqInput,
  VerifyOtpRes,
} from './dto/auth.args';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/request-otp')
  async requestOtp(
    @Body() body: RequestOtpReqInput,
    @Res() response: Response,
  ) {
    const res: RequestOtpRes = await this.authService.requestOtp(body);
    return response.status(res.status).send({
      ...res,
    });
  }

  @Post('/verify-otp')
  async verifyOtp(@Body() body: VerifyOtpReqInput, @Res() response: Response) {
    const res: VerifyOtpRes = await this.authService.verifyOtp(body);
    return response.status(res.status).send({
      ...res,
    });
  }
}
