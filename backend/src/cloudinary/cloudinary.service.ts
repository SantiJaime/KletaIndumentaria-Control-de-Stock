import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

/** Formatos de imagen aceptados para las fotos de productos. */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Tamaño máximo de una foto (las funciones de Vercel no aceptan cuerpos de más de 4,5 MB). */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Carpeta por defecto en Cloudinary. En desarrollo conviene otra (`CLOUDINARY_FOLDER`) para no pisar las de producción. */
const DEFAULT_FOLDER = 'kleta/products';

/** Lado máximo (px) con el que se guarda la foto: Cloudinary la achica al subirla si es más grande. */
const MAX_IMAGE_SIDE = 1200;

/**
 * Sube y borra las fotos de los productos en Cloudinary. Las credenciales (`CLOUDINARY_CLOUD_NAME`,
 * `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) solo viven en el backend. Son opcionales para que la app arranque
 * sin ellas: si faltan, subir o borrar responde 503.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly configured: boolean;
  private readonly folder: string;

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    this.folder = config.get<string>('CLOUDINARY_FOLDER') || DEFAULT_FOLDER;
    this.configured = Boolean(cloudName && apiKey && apiSecret);
    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else {
      this.logger.warn(
        'Cloudinary no está configurado: no se van a poder subir fotos de productos',
      );
    }
  }

  /**
   * Sube (o reemplaza) la foto de un producto y devuelve su URL https. Cada producto tiene una sola foto con un id
   * fijo (`<carpeta>/<productId>`): subir otra la pisa. La URL incluye la versión, así que cambia en cada subida
   * y el navegador no muestra la vieja desde la caché.
   */
  async uploadProductImage(
    productId: number,
    file: { buffer: Buffer; mimetype: string; size: number },
  ): Promise<string> {
    this.assertConfigured();
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('La foto debe ser JPG, PNG o WEBP');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('La foto no puede superar los 4 MB');
    }

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              public_id: this.publicId(productId),
              overwrite: true,
              invalidate: true,
              resource_type: 'image',
              // Se guarda achicada: alcanza para mostrarla y ocupa menos espacio del plan gratuito.
              transformation: [
                {
                  width: MAX_IMAGE_SIDE,
                  height: MAX_IMAGE_SIDE,
                  crop: 'limit',
                },
              ],
            },
            (error, response) =>
              error || !response
                ? reject(error ?? new Error('Cloudinary no devolvió respuesta'))
                : resolve(response),
          )
          .end(file.buffer);
      });
      return result.secure_url;
    } catch (error) {
      this.logger.error('Error al subir la foto a Cloudinary', error);
      throw new BadGatewayException(
        'No se pudo subir la foto. Intentá de nuevo.',
      );
    }
  }

  /** Borra la foto de un producto. Si no tenía, no hace nada. */
  async deleteProductImage(productId: number): Promise<void> {
    this.assertConfigured();
    try {
      await cloudinary.uploader.destroy(this.publicId(productId), {
        resource_type: 'image',
        invalidate: true,
      });
    } catch (error) {
      this.logger.error('Error al borrar la foto de Cloudinary', error);
      throw new BadGatewayException(
        'No se pudo borrar la foto. Intentá de nuevo.',
      );
    }
  }

  private publicId(productId: number) {
    return `${this.folder}/${productId}`;
  }

  private assertConfigured() {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'La subida de fotos no está configurada',
      );
    }
  }
}
