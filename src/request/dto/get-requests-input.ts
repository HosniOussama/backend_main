import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Request } from '../entities/request.entity';
import { PaginatorInfo } from '../../common/responses.dto';
import { ERequestStatus } from '../../common/enums';

export class GetRequestsInput {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ERequestStatus)
  status?: ERequestStatus;

  @IsOptional()
  @IsString()
  requestTypeId?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  skip?: number;
}

export interface GetRequestsPaginator {
  data: Request[];
  paginatorInfo: PaginatorInfo;
}
