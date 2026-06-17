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
import { RequestTypeService } from './request-type.service';
import { CreateRequestTypeInput } from './dto/create-request-type.input';
import { UpdateRequestTypeInput } from './dto/update-request-type.input';
import { IBaseRes } from '../common/responses.dto';
import { RequestType } from './entities/request-type.entity';
import { AuthGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators/roles.decorator';
import { ERole } from '../common/enums';

export interface GetRequestTypeRes extends IBaseRes {
  requestType?: RequestType;
}

export interface GetAllRequestTypesRes extends IBaseRes {
  requestTypes?: RequestType[];
}

@Controller('request-type')
export class RequestTypeController {
  constructor(private readonly requestTypeService: RequestTypeService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN, ERole.OFFICER)
  @Post()
  async createRequestType(
    @Body() createRequestTypeInput: CreateRequestTypeInput,
  ): Promise<GetRequestTypeRes> {
    return await this.requestTypeService.createRequestType(
      createRequestTypeInput,
    );
  }

  @UseGuards(AuthGuard)
  @Get('all')
  async getAllRequestTypes(): Promise<GetAllRequestTypesRes> {
    return await this.requestTypeService.getAllRequestTypes();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getRequestTypeById(
    @Param('id') id: string,
  ): Promise<GetRequestTypeRes> {
    return await this.requestTypeService.getRequestTypeById(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN, ERole.OFFICER)
  @Patch()
  async updateRequestType(
    @Body() updateRequestTypeInput: UpdateRequestTypeInput,
  ): Promise<GetRequestTypeRes> {
    return await this.requestTypeService.updateRequestType(
      updateRequestTypeInput,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(ERole.ADMIN)
  @Delete()
  async deleteRequestType(
    @Body()
    deleteRequestTypeInput: {
      requestTypeId: string;
      isDeleted: boolean;
    },
  ): Promise<GetRequestTypeRes> {
    return await this.requestTypeService.deleteRequestType(
      deleteRequestTypeInput,
    );
  }
}
