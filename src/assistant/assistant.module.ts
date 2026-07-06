import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { RequestTypeModule } from '../request-type/request-type.module';

@Module({
  imports: [RequestTypeModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
