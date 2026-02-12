/**
 * Response Wrapper Middleware
 *
 * Wraps successful JSON responses in { success: true, data: ... } format.
 * Error responses are handled by errorHandler with { success: false, error: ... }.
 */

import { Request, Response, NextFunction } from 'express';

export function responseWrapper(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    // Don't wrap if already wrapped or if it's an error response
    if (
      body &&
      typeof body === 'object' &&
      ('success' in (body as Record<string, unknown>))
    ) {
      return originalJson(body);
    }

    // Don't wrap error responses (4xx, 5xx)
    if (res.statusCode >= 400) {
      return originalJson(body);
    }

    return originalJson({
      success: true,
      data: body,
    });
  };

  next();
}
