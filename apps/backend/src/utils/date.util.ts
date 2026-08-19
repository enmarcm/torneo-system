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
export const dayRange = (day: Date | string = new Date()) => ({
  start: dayjs(day).tz(TZ).startOf('day').toDate(),
  end: dayjs(day).tz(TZ).endOf('day').toDate(),
});
