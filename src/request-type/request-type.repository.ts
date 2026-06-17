import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '../common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { RequestType } from './entities/request-type.entity';

@Injectable()
export class RequestTypeRepository extends AbstractRepository<RequestType> {
  protected readonly logger = new Logger(RequestTypeRepository.name);

  constructor(
    @InjectModel(RequestType.name) requestTypeModel: Model<RequestType>,
    @InjectConnection() connection: Connection,
  ) {
    super(requestTypeModel, connection);
  }
}
