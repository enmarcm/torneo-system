import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const TZ = 'America/Caracas';

export const formatDateTime = (d: string | Date) =>
  dayjs(d).tz(TZ).format('DD-MM-YYYY hh:mm A');

export const formatDate = (d: string | Date) =>
  dayjs(d).tz(TZ).format('DD-MM-YYYY');

export const formatTime = (d: string | Date) =>
  dayjs(d).tz(TZ).format('hh:mm A');

export const calcAge = (birthDate: string | Date) =>
  dayjs().diff(dayjs(birthDate), 'year');

export const todayLong = () =>
  dayjs().tz(TZ).format('dddd, DD [de] MMMM');
