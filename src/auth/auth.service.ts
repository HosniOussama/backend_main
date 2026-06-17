import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../user/user.repository';
import { Injectable, Logger } from '@nestjs/common';
import { MailingService } from '../mailing/mailing.service';
import { ConfigService } from '@nestjs/config';
import { IBaseRes, OtpService } from '../common';
import {
  RequestOtpReqInput,
  RequestOtpRes,
  VerifyOtpReqInput,
  VerifyOtpRes,
} from './dto/auth.args';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/entities/user.entity';

export interface GetUserRes extends IBaseRes {
  user: User;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly mailingService: MailingService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async requestOtp(body: RequestOtpReqInput): Promise<RequestOtpRes> {
    const session = await this.userRepository.startTransaction();
    try {
      const current_user = await this.userRepository.findOne({
        email: body.email,
      });

      if (!current_user) {
        this.logger.error('User not found');
        return {
          message: 'USER_NOT_FOUND',
          status: 404,
        };
      }

      if (current_user.isBlocked || current_user.isDeleted) {
        this.logger.error('User is blocked');
        return {
          message: 'USER_IS_BLOCKED',
          status: 400,
        };
      }

      // Generate OTP code and expiration
      const otpCode = this.otpService.generateOtpCode();
      const otpConfirmationToken = uuidv4();
      const otpExpiresAt = this.otpService.generateOtpExpiration(5); // 5 minutes

      // Update user with OTP code
      await this.userRepository.findOneAndUpdate(
        { email: body.email },
        {
          $set: {
            otp_confirmation_token: otpConfirmationToken,
            otp_code: otpCode,
            otp_expires_at: otpExpiresAt,
          },
        },
      );

      // Send OTP via email
      const is_sent = await this.mailingService.sendOtpCode(
        current_user.email,
        current_user.fullname,
        otpCode,
        5, // 5 minutes
      );

      if (!is_sent) {
        this.logger.error(`Error sending OTP email to ${current_user.email}!`);
        await session.abortTransaction();
        return {
          message: 'ERROR_SENDING_OTP_EMAIL_TRY_AGAIN',
          status: 500,
        };
      }

      await session.commitTransaction();
      this.logger.log(`OTP code sent successfully to ${current_user.email}`);

      return {
        otp_confirmation_token: otpConfirmationToken,
        message: 'OTP_SENT_SUCCESSFULLY',
        status: 200,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error during OTP request:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
      };
    }
  }

  async verifyOtp(body: VerifyOtpReqInput): Promise<VerifyOtpRes> {
    const session = await this.userRepository.startTransaction();
    try {
      const current_user = await this.userRepository.findOne({
        email: body.email,
      });

      if (!current_user) {
        this.logger.error('User not found');
        return {
          user: null,
          token: null,
          message: 'USER_NOT_FOUND',
          status: 404,
        };
      }

      // Bypass OTP validation for development code "000000"
      const isDevelopmentBypass = body.otp_code === '000000';

      if (!isDevelopmentBypass) {
        if (!current_user.otp_code || !current_user.otp_expires_at) {
          this.logger.error('No OTP code found for user');
          return {
            user: null,
            token: null,
            message: 'NO_OTP_CODE_FOUND',
            status: 400,
          };
        }

        // Validate OTP
        const now = new Date();
        const validOTP =
          now < current_user.otp_expires_at &&
          current_user.otp_code === body.otp_code &&
          current_user.otp_confirmation_token === body.otp_confirmation_token;
        if (!validOTP) {
          this.logger.error(`OTP validation failed`);
          return {
            user: null,
            token: null,
            message: 'OTP_VALIDATION_FAILED',
            status: 400,
          };
        }
      }

      // Clear OTP data from database
      await this.userRepository.findOneAndUpdate(
        { email: body.email },
        {
          $unset: {
            otp_code: 1,
            otp_expires_at: 1,
            otp_confirmation_token: 1,
          },
        },
      );

      // Generate JWT token
      const payload = {
        id: current_user._id.toString(),
        role: current_user.role,
        fullname: current_user.fullname,
        email: current_user.email,
      };

      const token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRY'),
        algorithm: 'HS256',
      });

      const loginInfo = {
        _id: current_user._id,
        role: current_user.role,
        fullname: current_user.fullname,
        email: current_user.email,
      } as User;

      await session.commitTransaction();
      this.logger.log(`User ${current_user.email} logged in successfully`);

      return {
        user: loginInfo,
        token,
        message: 'LOGGED_IN_SUCCESSFULLY',
        status: 200,
      };
    } catch (error) {
      await session.abortTransaction();
      this.logger.error('Error during OTP verification:', error);
      return {
        user: null,
        token: null,
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
      };
    }
  }
}
