import { Module } from '@nestjs/common';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestSchema, Request } from './entities/request.entity';
import { DatabaseModule } from '../common/database/database.module';
import { RequestRepository } from './request.repository';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  RequestType,
  RequestTypeSchema,
} from '../request-type/entities/request-type.entity';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: RequestType.name, schema: RequestTypeSchema },
    ]),
  ],
  controllers: [RequestController],
  providers: [RequestService, RequestRepository, UserRepository],
  exports: [RequestService, RequestRepository],
})
export class RequestModule {}
