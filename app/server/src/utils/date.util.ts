const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VN_TZ_OFFSET = 7 * 60 * 60 * 1000; 

export function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function monthRangeUTC(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));
  return { start, end };
}

export function parseDateOnly(value: string): Date {
  return new Date(value);
}

export function combineDateAndTime(workDate: Date, hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const localMs = Date.UTC(
    workDate.getUTCFullYear(),
    workDate.getUTCMonth(),
    workDate.getUTCDate(),
    hours,
    minutes,
  );
  return new Date(localMs - VN_TZ_OFFSET); 
}

