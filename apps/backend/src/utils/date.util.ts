import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const TZ = 'America/Caracas';

export const calcAge = (birthDate: Date | string): number =>
  dayjs().tz(TZ).diff(dayjs(birthDate).tz(TZ), 'year');

export const formatDate = (d: Date | string): string =>
  dayjs(d).tz(TZ).format('DD-MM-YYYY hh:mm A');

/**
 * Comienzo y fin del día de hoy en hora de Venezuela, expresados en UTC para
 * poder compararlos contra lo guardado en la base.
 */
export const dayRange = (day: Date | string = new Date()) => {
  /*
    Una fecha sin hora ('2026-08-20') es ese día en Venezuela, no la medianoche
    del servidor: interpretarla en el huso de la máquina corría el rango un día
    entero cuando el servidor está en UTC.
  */
  const base =
    typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
      ? dayjs.tz(day, TZ)
      : dayjs(day).tz(TZ);
  return { start: base.startOf('day').toDate(), end: base.endOf('day').toDate() };
};
