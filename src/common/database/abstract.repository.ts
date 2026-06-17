import { Logger } from '@nestjs/common';
import { AbstractDocument } from './abstract.entity';
import {
  Connection,
  FilterQuery,
  Model,
  SaveOptions,
  Types,
  UpdateQuery,
  ProjectionType,
  SortOrder,
} from 'mongoose';
import { PaginatorInfo } from '../responses.dto';

export interface PaginationOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, SortOrder>;
  select?: ProjectionType<any>;
}

export interface PaginationResult<T> {
  data: T[];
  paginatorInfo: PaginatorInfo;
}

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;

  constructor(
    private readonly model: Model<TDocument>,
    private readonly connection: Connection,
  ) {}

  async create(
    document: Omit<TDocument, '_id'>,
    options?: SaveOptions,
  ): Promise<TDocument> {
    const new_document = {
      ...document,
      _id: new Types.ObjectId(),
    };
    const createdDocument = new this.model(new_document);
    return (
      await createdDocument.save(options)
    ).toJSON() as unknown as TDocument;
  }

  async findOne(
    filterQuery: FilterQuery<TDocument>,
  ): Promise<TDocument | null> {
    const document = await this.model.findOne(
      {
        ...filterQuery,
      },
      {},
      { lean: true },
    );
    return document as TDocument | null;
  }

  async findOneWithPopulate(
    filterQuery: FilterQuery<TDocument>,
    populateFields: string[] = [],
  ): Promise<TDocument | null> {
    let query = this.model.findOne(
      {
        ...filterQuery,
      },
      {},
      { lean: true },
    );

    if (populateFields && populateFields.length > 0) {
      query = query.populate(populateFields);
    }

    const document = await query;
    return document as TDocument | null;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ): Promise<TDocument | undefined> {
    const document = await this.model.findOneAndUpdate(
      {
        ...filterQuery,
      },
      update,
      {
        lean: true,
        new: true,
      },
    );

    if (!document) {
      this.logger.warn(`Document not found with filterQuery:`, filterQuery);
      return undefined;
    }

    return document as unknown as TDocument;
  }

  async upsert(
    filterQuery: FilterQuery<TDocument>,
    document: Partial<TDocument>,
  ): Promise<TDocument | undefined> {
    const result = await this.model.findOneAndUpdate(
      {
        ...filterQuery,
      },
      document,
      {
        lean: true,
        upsert: true,
        new: true,
      },
    );
    return result as TDocument | undefined;
  }

  async find(filterQuery: FilterQuery<TDocument>): Promise<TDocument[]> {
    const results = await this.model.find(
      {
        ...filterQuery,
      },
      {},
      { lean: true },
    );
    return results as TDocument[];
  }

  async countDocuments(filterQuery: FilterQuery<TDocument>): Promise<number> {
    const results = await this.model.countDocuments({
      ...filterQuery,
    });
    return results as number;
  }

  async findDeleted(filterQuery: FilterQuery<TDocument>): Promise<TDocument[]> {
    const results = await this.model.find(
      {
        ...filterQuery,
      },
      {},
      { lean: true },
    );
    return results as TDocument[];
  }

  async startTransaction() {
    const session = await this.connection.startSession();
    session.startTransaction();
    return session;
  }

  async getWithPagination<T = TDocument>(
    filterQuery: FilterQuery<TDocument>,
    options: PaginationOptions = {},
  ): Promise<PaginationResult<T>> {
    const { limit = 10, skip = 0, sort = { createdAt: -1 }, select } = options;

    // Count total documents
    const totalCount = await this.model.countDocuments({
      ...filterQuery,
    });

    // Handle empty results
    if (totalCount === 0) {
      return {
        data: [],
        paginatorInfo: {
          count: 0,
          currentPage: 1,
          perPage: limit,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
        },
      };
    }

    // Build query
    let query = this.model
      .find({
        ...filterQuery,
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Add select if provided
    if (select) {
      query = query.select(select) as any;
    }

    // Execute query
    const data = await query;

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(skip / limit) + 1;

    return {
      data: data as T[],
      paginatorInfo: {
        count: totalCount,
        currentPage,
        perPage: limit,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
      },
    };
  }
}
