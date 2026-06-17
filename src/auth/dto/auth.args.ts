import { User } from '../../user/entities/user.entity';
import { IsEmail, IsNotEmpty, Length, IsString } from 'class-validator';
import { IBaseRes } from '../../common/responses.dto';

export class RequestOtpReqInput {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class VerifyOtpReqInput {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(36, 36)
  otp_confirmation_token: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp_code: string;
}

export interface RequestOtpRes extends IBaseRes {
  otp_confirmation_token?: string;
}

export interface VerifyOtpRes extends IBaseRes {
  user: User;
  token: string;
}
