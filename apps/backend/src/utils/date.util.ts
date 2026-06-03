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
