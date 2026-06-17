import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '../common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Request } from './entities/request.entity';

@Injectable()
export class RequestRepository extends AbstractRepository<Request> {
  protected readonly logger = new Logger(RequestRepository.name);

  constructor(
    @InjectModel(Request.name) requestModel: Model<Request>,
    @InjectConnection() connection: Connection,
  ) {
    super(requestModel, connection);
  }
}
