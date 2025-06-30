import { Request, Response } from 'express';
import { ResponseUtil } from '@/utils/response';

export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtil.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
};
