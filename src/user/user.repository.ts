import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '../common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository extends AbstractRepository<User> {
  protected readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectModel(User.name) orderModel: Model<User>,
    @InjectConnection() connection: Connection,
  ) {
    super(orderModel, connection);
  }
}
