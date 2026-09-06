/**
 * Consistent JSON responses for the QuestDaily REST layer.
 *
 * Convention:
 *  - Success: HTTP 2xx with the payload directly as the response body.
 *  - Failure: HTTP 4xx/5xx with `{ success: false, error: string }`.
 *
 * Flutter's ApiClient normalizes error bodies by reading `message` then
 * `error`, so the failure shape is forward-compatible with it.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(body: T, init: ResponseInit = {}): Response {
  return Response.json(body, { status: 200, ...init });
}

export function created<T>(body: T, init: ResponseInit = {}): Response {
  return Response.json(body, { status: 201, ...init });
}

export function fail(error: string, status = 400): Response {
  return Response.json({ success: false, error }, { status });
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return fail(error.message, error.status);
  }
  console.error("Unhandled API error:", error);
  return fail("Something went wrong. Please try again.", 500);
}