import { Request, Response, NextFunction } from 'express';
import { plainToInstance }                  from 'class-transformer';
import { validate }                         from 'class-validator';
import { AppError }                         from '../utils/AppError';

export const validateDto = (DtoClass: new () => object) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = plainToInstance(DtoClass, req.body);

      const errors = await validate(dto as object, {
        whitelist:            true,
        forbidNonWhitelisted: true,
        stopAtFirstError:     false,
      });

      if (errors.length > 0) {
        const messages = errors
          .map((e) => Object.values(e.constraints ?? {}).join(', '))
          .join(' | ');
        throw new AppError(messages, 400);
      }

      req.body = dto;
      next();
    } catch (err) {
      next(err);
    }
  };