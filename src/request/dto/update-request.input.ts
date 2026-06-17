import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ERequestStatus } from '../../common/enums';

export class UpdateRequestInput {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ERequestStatus)
  status?: ERequestStatus;

  @IsOptional()
  @IsString()
  requestTypeId?: string;
}
