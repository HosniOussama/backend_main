import { ERole } from '../../common';
import { IsEmail, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateUserInput {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  fullname?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  role?: ERole;
}
