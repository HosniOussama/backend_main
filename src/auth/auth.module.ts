import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
import { MailingService } from '../mailing/mailing.service';
import { DatabaseModule } from '../common/database/database.module';
import { CommonModule } from '../common';

@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, MailingService],
  exports: [AuthModule],
})
export class AuthModule {}
