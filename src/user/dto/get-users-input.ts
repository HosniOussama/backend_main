import { ERole, PaginatorInfo } from '../../common';
import { User } from '../entities/user.entity';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class GetUsersInput {
  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @IsString()
  role?: ERole;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  skip?: number;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}

export interface GetUsersPaginator {
  data: User[];
  paginatorInfo: PaginatorInfo;
}
