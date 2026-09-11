export interface ApiResponse<T> {
  data: T;
  error?: never;
}
export interface ApiError {
  error: string | Record<string, unknown>;
  data?: never;
}
export type ApiResult<T> = ApiResponse<T> | ApiError;
