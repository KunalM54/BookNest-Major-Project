export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-based page index
  size: number;
  first?: boolean;
  last?: boolean;
}
