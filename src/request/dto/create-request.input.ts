import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ERequestStatus } from '../../common/enums';
import { AbstractDocument } from '../../common/database/abstract.entity';

export class CreateRequestInput extends AbstractDocument {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(ERequestStatus)
  status?: ERequestStatus;

  @IsNotEmpty()
  @IsString()
  requestTypeId: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  steps?: string;
}
