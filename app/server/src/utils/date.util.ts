const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VN_TZ_OFFSET = 7 * 60 * 60 * 1000; 

export function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

// Tra ve "hom nay" (theo gio local cua server) dang mot Date neo o UTC midnight —
// bat buoc dung cach nay cho moi field @db.Date (Postgres DATE khong co timezone,
// driver doc/ghi theo phan UTC cua Date object). Neu dung `new Date(y, m, d)` (local
// constructor) thi voi timezone UTC+ (VD Asia/Saigon), local midnight se roi vao UTC
// NGAY HOM TRUOC, luu sai lui 1 ngay trong DB.
export function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// [start, end) cua 1 thang, ca 2 deu neo UTC midnight — dung de query field @db.Date
// theo dung "thang N nam Y" ma khong bi lech mui gio nhu startOfToday() da tung bi.
export function monthRangeUTC(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));
  return { start, end };
}

// Parse chuoi "YYYY-MM-DD" thanh Date. An toan voi timezone vi chuoi date-only theo
// chuan ISO 8601 luon duoc JS parse la UTC midnight (khac voi constructor new Date(y,m,d)
// dung gio local).
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

