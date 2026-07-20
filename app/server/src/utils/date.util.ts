const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
