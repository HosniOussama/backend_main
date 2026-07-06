import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { ChatInput } from './dto/chat.input';
import { AuthGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators/roles.decorator';
import { ERole } from '../common/enums';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.STUDENT)
  @Post('chat')
  async chat(@Body() body: ChatInput) {
    return this.assistantService.chat(body.messages);
  }
}
