export type AppErrorCode =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SERVER'
  | 'UNKNOWN';

export interface AppError {
  code: AppErrorCode;
  message: string;
  detail?: string;
  status?: number;
}
