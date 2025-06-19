export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export const DEFAULT_PAGE_SIZE = 20;
