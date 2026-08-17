import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/es';

dayjs.locale('es');
dayjs.extend(utc);
dayjs.extend(timezone);

export const TZ = 'America/Caracas';

export const formatDateTime = (d: string | Date) =>
  dayjs(d).tz(TZ).format('DD-MM-YYYY hh:mm A');

export const formatDate = (d: string | Date) =>
  dayjs(d).tz(TZ).format('DD-MM-YYYY');

export const formatTime = (d: string | Date) =>
  dayjs(d).tz(TZ).format('hh:mm A');

/**
 * Los partidos recién sorteados no tienen día ni hora todavía: el admin se los
 * asigna después, así que la fecha puede venir en null.
 */
export const UNSCHEDULED_LABEL = 'Por programar';

export const formatDateTimeOrPending = (d: string | Date | null | undefined) =>
  d ? formatDateTime(d) : UNSCHEDULED_LABEL;

export const formatDateOrPending = (d: string | Date | null | undefined) =>
  d ? formatDate(d) : UNSCHEDULED_LABEL;

export const formatTimeOrPending = (d: string | Date | null | undefined) =>
  d ? formatTime(d) : '--:--';

export const calcAge = (birthDate: string | Date) =>
  dayjs().diff(dayjs(birthDate), 'year');

export const todayLong = () =>
  dayjs().tz(TZ).format('dddd, DD [de] MMMM');
