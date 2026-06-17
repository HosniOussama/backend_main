import { IsString, IsOptional } from 'class-validator';

export class UpdateRequestTypeInput {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  steps?: string;
}
