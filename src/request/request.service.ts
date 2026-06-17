import { Injectable, Logger } from '@nestjs/common';
import { CreateRequestInput } from './dto/create-request.input';
import { UpdateRequestInput } from './dto/update-request.input';
import {
  GetRequestsInput,
  GetRequestsPaginator,
} from './dto/get-requests-input';
import { RequestRepository } from './request.repository';
import { GetRequestRes } from './request.controller';
import { Types } from 'mongoose';
import { ERequestStatus, ERole } from '../common/enums';
import { hasRole } from '../common/role.utils';
import { Request } from './entities/request.entity';
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';
import { MailingService } from '../mailing/mailing.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RequestService {
  private readonly logger = new Logger(RequestService.name);

  constructor(
    private readonly requestRepository: RequestRepository,
    private readonly userRepository: UserRepository,
    private readonly mailingService: MailingService,
    private readonly configService: ConfigService,
  ) {}

  private generateReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REQ-${timestamp}-${random}`;
  }

  async createRequest(
    createRequestInput: CreateRequestInput,
  ): Promise<GetRequestRes> {
    try {
      // Generate unique reference
      let reference = this.generateReference();
      let existingRequest = await this.requestRepository.findOne({ reference });

      // Ensure reference is unique
      while (existingRequest) {
        reference = this.generateReference();
        existingRequest = await this.requestRepository.findOne({ reference });
      }

      const newRequest = await this.requestRepository.create({
        ...createRequestInput,
        reference,
        status: createRequestInput.status || ERequestStatus.PENDING,
        requestTypeId: new Types.ObjectId(createRequestInput.requestTypeId),
        createdBy: new Types.ObjectId(createRequestInput.createdBy),
      });

      this.logger.log(`Request ${newRequest.reference} created successfully`);

      // Send email notifications to all officers
      try {
        const populatedRequest =
          await this.requestRepository.findOneWithPopulate(
            { _id: newRequest._id },
            ['requestTypeId', 'createdBy'],
          );

        if (populatedRequest) {
          const validators = await this.userRepository.find({
            role: ERole.OFFICER,
            isDeleted: false,
            isBlocked: false,
          });

          const frontendUrl = this.configService.get<string>(
            'FRONTEND_URL',
            'http://localhost:3000',
          );
          const requestUrl = `${frontendUrl}/apps/requests/view?id=${newRequest._id}`;

          const createdBy = populatedRequest.createdBy as any;
          const requestType = populatedRequest.requestTypeId as any;

          const requesterName =
            createdBy?.fullname || createdBy?.email || 'Unknown user';
          const requestTypeName =
            requestType?.name || 'Unknown request type';
          const createdAt = new Date(
            populatedRequest.created_at,
          ).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          // Send email to each validator
          for (const validator of validators) {
            if (validator.email) {
              await this.mailingService.sendRequestCreatedNotification(
                validator.email,
                validator.fullname || validator.email,
                {
                  reference: newRequest.reference,
                  title: newRequest.title,
                  requesterName,
                  requestTypeName,
                  createdAt,
                  requestUrl,
                },
              );
            }
          }

          this.logger.log(
            `Sent request created notifications to ${validators.length} validator(s)`,
          );
        }
      } catch (error) {
        // Log error but don't fail the request creation
        this.logger.error(
          'Error sending request created notifications:',
          error,
        );
      }

      return {
        request: newRequest,
        status: 201,
        message: 'REQUEST_CREATED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error creating request:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        request: null,
      };
    }
  }

  async updateRequest(
    updateRequestInput: UpdateRequestInput,
    user: User,
  ): Promise<GetRequestRes> {
    try {
      const { id, ...rest } = updateRequestInput;

      // Build query to check if request exists
      const query: any = { _id: id };

      // Students may only update their own requests
      if (hasRole(user.role, ERole.STUDENT)) {
        query.createdBy = (user as any).id;
      }

      // Check if request exists and user has permission
      const existingRequest = await this.requestRepository.findOne(query);
      if (!existingRequest) {
        this.logger.error(`Request with ID ${id} not found or access denied`);
        return {
          request: null,
          message: 'REQUEST_NOT_FOUND',
          status: 404,
        };
      }

      // Check if status is changing to COMPLETED
      const isStatusChangingToCompleted =
        rest.status === ERequestStatus.COMPLETED &&
        existingRequest.status !== ERequestStatus.COMPLETED;

      // Convert requestTypeId to ObjectId if provided
      const updateData: any = { ...rest };
      if (rest.requestTypeId) {
        updateData.requestTypeId = new Types.ObjectId(rest.requestTypeId);
      }

      // Update the request
      const updatedRequest = await this.requestRepository.findOneAndUpdate(
        { _id: id },
        updateData,
      );

      this.logger.log(
        `Request ${updatedRequest.reference} updated successfully`,
      );

      // Send email notification if status changed to COMPLETED
      if (isStatusChangingToCompleted) {
        try {
          const populatedRequest =
            await this.requestRepository.findOneWithPopulate(
              { _id: updatedRequest._id },
              ['requestTypeId', 'createdBy'],
            );

          if (populatedRequest) {
            const createdBy = populatedRequest.createdBy as any;
            const requestType = populatedRequest.requestTypeId as any;

            if (createdBy && createdBy.email) {
              const frontendUrl = this.configService.get<string>(
                'FRONTEND_URL',
                'http://localhost:3000',
              );
              const requestUrl = `${frontendUrl}/apps/requests/view?id=${updatedRequest._id}`;

              const requestTypeName =
                requestType?.name || 'Unknown request type';
              const completedAt = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              await this.mailingService.sendRequestCompletedNotification(
                createdBy.email,
                createdBy.fullname || createdBy.email,
                {
                  reference: updatedRequest.reference,
                  title: updatedRequest.title,
                  requestTypeName,
                  completedAt,
                  requestUrl,
                },
              );

              this.logger.log(
                `Sent request completed notification to ${createdBy.email}`,
              );
            }
          }
        } catch (error) {
          // Log error but don't fail the request update
          this.logger.error(
            'Error sending request completed notification:',
            error,
          );
        }
      }

      return {
        request: updatedRequest,
        status: 200,
        message: 'REQUEST_UPDATED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error updating request:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        request: null,
      };
    }
  }

  async deleteRequest(deleteRequestInput: {
    requestId: string;
    isDeleted: boolean;
  }): Promise<GetRequestRes> {
    try {
      const { requestId, isDeleted } = deleteRequestInput;

      const query: any = { _id: requestId };

      const existingRequest = await this.requestRepository.findOne(query);
      if (!existingRequest) {
        this.logger.error(
          `Request with ID ${requestId} not found or access denied`,
        );
        return {
          request: null,
          message: 'REQUEST_NOT_FOUND',
          status: 404,
        };
      }

      const deletedRequest = await this.requestRepository.findOneAndUpdate(
        { _id: requestId },
        { isDeleted: isDeleted },
      );

      return {
        request: deletedRequest,
        status: 200,
        message: 'REQUEST_DELETED_SUCCESSFULLY',
      };
    } catch (error) {
      this.logger.error('Error deleting request:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        request: null,
      };
    }
  }

  async getRequestsWithPagination(
    getRequestInput: GetRequestsInput,
    user: User,
  ): Promise<GetRequestsPaginator> {
    try {
      const {
        title,
        status,
        requestTypeId,
        createdBy,
        limit = 10,
        skip = 0,
      } = getRequestInput;
      const query: any = { isDeleted: false };

      // Students only see their own requests
      if (hasRole(user.role, ERole.STUDENT)) {
        query.createdBy = (user as any).id;
      } else if (createdBy) {
        // Admins and officers may filter by createdBy when provided
        query.createdBy = new Types.ObjectId(createdBy);
      }

      if (status) {
        query.status = status;
      }

      if (title) {
        query.title = { $regex: title, $options: 'i' };
      }

      if (requestTypeId) {
        query.requestTypeId = new Types.ObjectId(requestTypeId);
      }

      return await this.requestRepository.getWithPagination(query, {
        limit,
        skip,
        sort: { created_at: -1 },
      });
    } catch (error) {
      this.logger.error('Error getting requests:', error);
      return {
        data: [],
        paginatorInfo: {
          count: 0,
          currentPage: 1,
          perPage: getRequestInput.limit || 10,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
        },
      };
    }
  }

  async getRequestById(id: string): Promise<GetRequestRes> {
    try {
      const query: any = { _id: id };

      const request = await this.requestRepository.findOneWithPopulate(query, [
        'requestTypeId',
        'createdBy',
      ]);

      if (!request) {
        return {
          request: null,
          message: 'REQUEST_NOT_FOUND',
          status: 404,
        };
      }

      return {
        request,
        status: 200,
        message: 'REQUEST_FOUND',
      };
    } catch (error) {
      this.logger.error('Error getting request by ID:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        request: null,
      };
    }
  }

  async getRequestByReference(
    reference: string,
    user: User,
  ): Promise<GetRequestRes> {
    try {
      const query: any = { reference };

      // Students may only access their own requests
      if (hasRole(user.role, ERole.STUDENT)) {
        query.createdBy = (user as any).id;
      }

      const request = await this.requestRepository.findOneWithPopulate(query, [
        'requestTypeId',
        'createdBy',
      ]);

      if (!request) {
        return {
          request: null,
          message: 'REQUEST_NOT_FOUND',
          status: 404,
        };
      }

      return {
        request,
        status: 200,
        message: 'REQUEST_FOUND',
      };
    } catch (error) {
      this.logger.error('Error getting request by reference:', error);
      return {
        message: 'INTERNAL_SERVER_ERROR',
        status: 500,
        request: null,
      };
    }
  }

  async getAllRequests(
    user,
    filters?: {
      title?: string;
      status?: ERequestStatus;
      requestTypeId?: string;
      createdBy?: string;
    },
  ): Promise<{ requests: Request[]; status: number; message: string }> {
    try {
      const query: any = { isDeleted: false };

      // Students only see their own requests
      if (hasRole(user.role, ERole.STUDENT)) {
        query.createdBy = new Types.ObjectId(user.id);
      } else if (filters?.createdBy) {
        // Admins and officers may filter by createdBy when provided
        query.createdBy = filters.createdBy;
      }

      if (filters?.status) {
        query.status = filters.status;
      }

      if (filters?.title) {
        query.title = { $regex: filters.title, $options: 'i' };
      }

      if (filters?.requestTypeId) {
        query.requestTypeId = new Types.ObjectId(filters.requestTypeId);
      }

      const requests = await this.requestRepository.find(query);

      // Populate related fields
      const populatedRequests = await Promise.all(
        requests.map(async (request) => {
          return await this.requestRepository.findOneWithPopulate(
            { _id: request._id },
            ['requestTypeId', 'createdBy'],
          );
        }),
      );

      return {
        requests: populatedRequests.filter((r) => r !== null) as Request[],
        status: 200,
        message: 'REQUESTS_FOUND',
      };
    } catch (error) {
      this.logger.error('Error getting all requests:', error);
      return {
        requests: [],
        status: 500,
        message: 'INTERNAL_SERVER_ERROR',
      };
    }
  }
}
