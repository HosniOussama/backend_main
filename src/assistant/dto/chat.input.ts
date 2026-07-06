import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ChatMessageInput {
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ChatInput {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageInput)
  messages: ChatMessageInput[];
}
