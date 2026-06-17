import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { AbstractDocument } from '../../common/database/abstract.entity';

export class CreateRequestTypeInput extends AbstractDocument {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  steps?: string;
}
