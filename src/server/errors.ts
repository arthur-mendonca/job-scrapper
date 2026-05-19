import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function notFound(message: string): ApiError {
  return new ApiError(404, 'NOT_FOUND', message);
}

export function formatApiError(error: unknown) {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request.',
          details: error.flatten()
        }
      }
    };
  }

  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error.'
      }
    }
  };
}
