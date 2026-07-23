import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { BadRequestError } from '../errors/AppError.js';

export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const input = source === 'body' ? (req.body ?? {}) : req[source];
    const result = schema.safeParse(input);

    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join(', ');
      throw new BadRequestError(message, 'VALIDATION_ERROR');
    }

    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req.body = result.data;
    }
    next();
  };
}