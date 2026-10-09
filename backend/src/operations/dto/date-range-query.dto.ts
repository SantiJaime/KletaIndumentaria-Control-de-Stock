import { IsISO8601, Matches } from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Rango de fechas obligatorio (yyyy-mm-dd, ambas inclusivas).
export class DateRangeQueryDto {
  @Matches(DATE_ONLY, {
    message: 'La fecha desde debe tener formato yyyy-mm-dd',
  })
  @IsISO8601({ strict: true }, { message: 'La fecha desde no es válida' })
  fromDate: string;

  @Matches(DATE_ONLY, {
    message: 'La fecha hasta debe tener formato yyyy-mm-dd',
  })
  @IsISO8601({ strict: true }, { message: 'La fecha hasta no es válida' })
  toDate: string;
}
