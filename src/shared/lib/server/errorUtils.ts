/**
 * Shared error handling utilities for API routes
 * Provides type-safe error extraction following TypeScript best practices
 */

/**
 * Helper to extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === "string") return err.message;
  }
  return "Unknown error";
}

/**
 * Helper to extract status code from unknown error
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.statusCode === "number") return err.statusCode;
    if (typeof err.status === "number") return err.status;
  }
  return undefined;
}
