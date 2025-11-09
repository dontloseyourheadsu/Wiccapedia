export interface Gem {
  id: string;
  name: string;
  image: string;
  magical_description: string;
  category: string;
  color: string;
  chemical_formula: string;
}

export interface CreateGemRequest {
  name: string;
  magical_description: string;
  category: string;
  color: string;
  chemical_formula: string;
}

export interface GemFilters {
  $search?: string;
  $filter?: string;
  $orderby?: string;
  name?: string;
  color?: string;
  category?: string;
  chemical_formula?: string;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginationInfo {
  has_next: boolean;
  has_previous: boolean;
  next_cursor?: string;
  previous_cursor?: string;
  total_count: number;
  page_size: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface SearchResponse {
  results: Gem[];
  count: number;
  query: string;
}

export interface MetadataResponse {
  colors?: string[];
  categories?: string[];
  formulas?: string[];
}

export interface ApiError {
  error: string;
  message?: string;
  id?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}
