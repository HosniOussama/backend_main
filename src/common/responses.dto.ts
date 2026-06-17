export interface IBaseRes {
  message?: string;
  status?: number;
}

export interface PaginatorInfo {
  count: number;
  currentPage: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}
