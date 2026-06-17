import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Post,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard, RolesGuard } from '../guards';
import { CurrentUser } from '../decorators';
import { User } from './entities/user.entity';
import { GetUsersPaginator } from './dto/get-users-input';
import { GetUsersInput } from './dto/get-users-input';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update.user.input';
import { IBaseRes } from '../common/responses.dto';
import { ERole } from '../common/enums';
import { Roles } from '../decorators/roles.decorator';

export interface GetUserRes extends IBaseRes {
  user: User;
}

export interface GetAllUsersRes extends IBaseRes {
  users: User[];
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async findMe(@CurrentUser() user: User): Promise<GetUserRes> {
    if (user) {
      return {
        message: 'USER_FOUND_SUCCESSFULLY',
        status: 200,
        user,
      };
    } else {
      return {
        message: 'USER_NOT_FOUND',
        status: 404,
        user: null,
      };
    }
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Post()
  async createUser(
    @Body() createUserInput: CreateUserInput,
  ): Promise<GetUserRes> {
    return await this.userService.createUser(createUserInput);
  }

  @UseGuards(AuthGuard)
  @Patch()
  async updateUser(
    @Body() updateUserInput: UpdateUserInput,
  ): Promise<GetUserRes> {
    return await this.userService.updateUser(updateUserInput);
  }

  @UseGuards(AuthGuard)
  @Post('with-pagination')
  async getUsersWithPagination(
    @Body() getUsersInput: GetUsersInput,
  ): Promise<GetUsersPaginator> {
    return await this.userService.getUsersWithPagination(getUsersInput);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getAllUsers(): Promise<GetAllUsersRes> {
    return await this.userService.getAllUsers();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<GetUserRes> {
    return await this.userService.getUserById(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Patch('delete/:id')
  async deleteUser(@Param('id') id: string): Promise<GetUserRes> {
    return await this.userService.updateUser({
      id,
      isDeleted: true,
    });
  }
}
