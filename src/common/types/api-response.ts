export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorBody;
}
