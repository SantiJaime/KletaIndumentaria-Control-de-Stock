import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { sanitizeBarcode } from '../barcode.util.js';

/** Limpia el código de barras de un parámetro de ruta; si no queda nada, responde 400. */
@Injectable()
export class SanitizeBarcodePipe implements PipeTransform<string, string> {
  transform(value: string) {
    const barcode = sanitizeBarcode(value);
    if (!barcode) {
      throw new BadRequestException(
        'El código de barras debe tener letras o números',
      );
    }
    return barcode;
  }
}
