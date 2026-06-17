import { Module } from '@nestjs/common';
import { RequestTypeService } from './request-type.service';
import { RequestTypeController } from './request-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestTypeSchema, RequestType } from './entities/request-type.entity';
import { DatabaseModule } from '../common/database/database.module';
import { RequestTypeRepository } from './request-type.repository';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      {
        name: RequestType.name,
        schema: RequestTypeSchema,
      },
    ]),
  ],
  controllers: [RequestTypeController],
  providers: [RequestTypeService, RequestTypeRepository],
  exports: [RequestTypeService, RequestTypeRepository],
})
export class RequestTypeModule {}
