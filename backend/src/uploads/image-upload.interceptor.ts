import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import multer from 'multer';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from '../cloudinary/cloudinary.service.js';

/** Campo del formulario multipart con la foto. */
export const IMAGE_FIELD = 'image';

// En memoria (no en disco): en Vercel el disco es de solo lectura y la foto va directo a Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, done) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      done(null, true);
    } else {
      done(new BadRequestException('La foto debe ser JPG, PNG o WEBP'));
    }
  },
}).single(IMAGE_FIELD);

// Los errores de multer vienen en inglés: se traducen a respuestas HTTP en español.
const toHttpError = (error: unknown) => {
  if (!(error instanceof multer.MulterError)) return error;
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return new PayloadTooLargeException('La foto no puede superar los 4 MB');
    case 'LIMIT_FILE_COUNT':
    case 'LIMIT_UNEXPECTED_FILE':
      return new BadRequestException(
        `Enviá una sola foto en el campo "${IMAGE_FIELD}"`,
      );
    default:
      return new BadRequestException('No se pudo leer la foto enviada');
  }
};

/**
 * Lee la foto (multipart/form-data, campo `image`) con multer y la deja en `req.file` (se obtiene con
 * `@UploadedFile()`). Rechaza otros formatos (400) y fotos de más de 4 MB (413). No exige que venga: eso lo
 * valida quien la usa.
 */
@Injectable()
export class ImageUploadInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    await new Promise<void>((resolve, reject) =>
      upload(req, res, (error: unknown) =>
        error ? reject(toHttpError(error)) : resolve(),
      ),
    );
    return next.handle();
  }
}
