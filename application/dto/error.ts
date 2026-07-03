export type ApiErrorDto = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ApiErrorResponseDto = {
  error: ApiErrorDto;
};
