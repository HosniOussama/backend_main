import { Injectable, Logger } from '@nestjs/common';
import { CreateRequestTypeInput } from './dto/create-request-type.input';
import { UpdateRequestTypeInput } from './dto/update-request-type.input';
import { RequestTypeRepository } from './request-type.repository';
import { GetRequestTypeRes } from './request-type.controller';
import { RequestType } from './entities/request-type.entity';

@Injectable()
export class RequestTypeService {
  private readonly logger = new Logger(RequestTypeService.name);

  constructor(private readonly requestTypeRepository: RequestTypeRepository) {}

  async createRequestType(
    createRequestTypeInput: CreateRequestTypeInput,
  ): Promise<GetRequestTypeRes> {
    try {
      // Check if request type with same name already exists
      const existingRequestType = await this.requestTypeRepository.findOne({
        name: createRequestTypeInput.name,
      });

      if (existingRequestType) {
        this.logger.error(
          `Request type with name ${createRequestTypeInput.name} already exists!`,
        );
        return {
          requestType: null,
          message: 'REQUEST_TYPE_ALREADY_EXISTS',
          status: 400,
        };
      }

      const newRequestType = await this.requestTypeRepository.create({
        ...createRequestTypeInput,
        isDeleted: false,
      });

      this.logger.log(
        `Request type ${newRequestType._id} created successfully`,
      );

      return {
        requestType: newRequestType,
        status: 201,
        message: 'REQUEST_TYPE_CREATED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error creating request type:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        requestType: null,
      };
    }
  }

  async updateRequestType(
    updateRequestTypeInput: UpdateRequestTypeInput,
  ): Promise<GetRequestTypeRes> {
    try {
      const { id, ...rest } = updateRequestTypeInput;

      // Check if request type exists first
      const existingRequestType = await this.requestTypeRepository.findOne({
        _id: id,
      });
      if (!existingRequestType) {
        this.logger.error(`Request type with ID ${id} not found`);
        return {
          requestType: null,
          message: 'REQUEST_TYPE_NOT_FOUND',
          status: 404,
        };
      }

      // Check if name is already used by another request type
      if (updateRequestTypeInput.name) {
        const requestTypeWithSameName =
          await this.requestTypeRepository.findOne({
            name: updateRequestTypeInput.name,
            _id: { $ne: id },
          });
        if (requestTypeWithSameName) {
          this.logger.error(
            `Request type with name ${updateRequestTypeInput.name} already exists!`,
          );
          return {
            requestType: null,
            message: 'REQUEST_TYPE_NAME_ALREADY_EXISTS',
            status: 400,
          };
        }
      }

      // Update the request type
      const updatedRequestType =
        await this.requestTypeRepository.findOneAndUpdate(
          { _id: id },
          { ...rest },
        );
      this.logger.log(
        `Request type ${updatedRequestType._id} updated successfully`,
      );

      return {
        requestType: updatedRequestType,
        status: 200,
        message: 'REQUEST_TYPE_UPDATED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error updating request type:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        requestType: null,
      };
    }
  }

  async deleteRequestType(deleteRequestTypeInput: {
    requestTypeId: string;
    isDeleted: boolean;
  }): Promise<GetRequestTypeRes> {
    try {
      const { requestTypeId, isDeleted } = deleteRequestTypeInput;
      const deletedRequestType =
        await this.requestTypeRepository.findOneAndUpdate(
          { _id: requestTypeId },
          { isDeleted: isDeleted },
        );
      if (!deletedRequestType) {
        return {
          requestType: null,
          message: 'REQUEST_TYPE_NOT_FOUND',
          status: 404,
        };
      }

      return {
        requestType: deletedRequestType,
        status: 200,
        message: 'REQUEST_TYPE_DELETED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error deleting request type:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        requestType: null,
      };
    }
  }

  async getAllRequestTypes(): Promise<{
    requestTypes: RequestType[];
    status: number;
    message: string;
  }> {
    try {
      const requestTypes = await this.requestTypeRepository.find({
        isDeleted: false,
      });

      return {
        requestTypes,
        status: 200,
        message: 'REQUEST_TYPES_FOUND',
      };
    } catch (error) {
      this.logger.error('Error getting all request types:', error);
      return {
        requestTypes: [],
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
      };
    }
  }

  async getRequestTypeById(id: string): Promise<GetRequestTypeRes> {
    try {
      const requestType = await this.requestTypeRepository.findOne({ _id: id });

      if (!requestType) {
        return {
          requestType: null,
          message: 'REQUEST_TYPE_NOT_FOUND',
          status: 404,
        };
      }

      return {
        requestType,
        status: 200,
        message: 'REQUEST_TYPE_FOUND',
      };
    } catch (error) {
      this.logger.error('Error getting request type by ID:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        requestType: null,
      };
    }
  }
}
