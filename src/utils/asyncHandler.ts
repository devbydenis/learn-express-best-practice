import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper untuk async route handlers
 * Menghilangkan kebutuhan try-catch di setiap route
 * Semua errors otomatis di-forward ke global error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
