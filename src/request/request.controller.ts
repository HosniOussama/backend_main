import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequestService } from './request.service';
import { CreateRequestInput } from './dto/create-request.input';
import { UpdateRequestInput } from './dto/update-request.input';
import { IBaseRes } from '../common/responses.dto';
import { Request } from './entities/request.entity';
import {
  GetRequestsInput,
  GetRequestsPaginator,
} from './dto/get-requests-input';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';
import { User } from '../user/entities/user.entity';

export interface GetRequestRes extends IBaseRes {
  request?: Request;
}

export interface GetAllRequestsRes extends IBaseRes {
  requests: Request[];
}

@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @UseGuards(AuthGuard)
  @Post()
  async createRequest(
    @Body() createRequestInput: CreateRequestInput,
    @CurrentUser() user,
  ): Promise<GetRequestRes> {
    createRequestInput.createdBy = user.id;
    return await this.requestService.createRequest(createRequestInput);
  }

  @UseGuards(AuthGuard)
  @Get('with-pagination')
  async getRequestsWithPagination(
    @Body() getRequestInput: GetRequestsInput,
    @CurrentUser() user: User,
  ): Promise<GetRequestsPaginator> {
    return await this.requestService.getRequestsWithPagination(
      getRequestInput,
      user,
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  async getAllRequests(@CurrentUser() user: User): Promise<GetAllRequestsRes> {
    return await this.requestService.getAllRequests(user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getRequestById(@Param('id') id: string): Promise<GetRequestRes> {
    return await this.requestService.getRequestById(id);
  }

  @UseGuards(AuthGuard)
  @Get('reference/:reference')
  async getRequestByReference(
    @Param('reference') reference: string,
    @CurrentUser() user: User,
  ): Promise<GetRequestRes> {
    return await this.requestService.getRequestByReference(reference, user);
  }

  @UseGuards(AuthGuard)
  @Patch()
  async updateRequest(
    @Body() updateRequestInput: UpdateRequestInput,
    @CurrentUser() user: User,
  ): Promise<GetRequestRes> {
    return await this.requestService.updateRequest(updateRequestInput, user);
  }

  @UseGuards(AuthGuard)
  @Delete()
  async deleteRequest(
    @Body() deleteRequestInput: { requestId: string; isDeleted: boolean },
  ): Promise<GetRequestRes> {
    return await this.requestService.deleteRequest(deleteRequestInput);
  }
}
