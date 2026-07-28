const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VN_TZ_OFFSET = 7 * 60 * 60 * 1000; 

// daysBetween là hàm tính số ngày giữa hai ngày. Nó nhận vào hai đối tượng Date (start và end) và trả về số ngày nguyên giữa chúng. Hàm này sử dụng phương thức getTime() để lấy số mili giây kể từ thời điểm 1/1/1970 của cả hai ngày, sau đó tính hiệu và chia cho số mili giây trong một ngày (MS_PER_DAY) để có được số ngày.

export function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
}

// startOfToday là hàm trả về một đối tượng Date đại diện cho thời điểm bắt đầu của ngày hôm nay (00:00:00) theo giờ UTC. Nó tạo ra một đối tượng Date mới với năm, tháng và ngày hiện tại, nhưng đặt giờ, phút và giây về 0.

export function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// monthRangeUTC là hàm trả về phạm vi ngày (start và end) của một tháng cụ thể trong năm theo giờ UTC. Nó nhận vào hai tham số: year (năm) và month (tháng, từ 1 đến 12). Hàm này tạo ra hai đối tượng Date: start là ngày đầu tiên của tháng và end là ngày đầu tiên của tháng tiếp theo. Nếu tháng là 12, end sẽ là ngày đầu tiên của tháng 1 năm sau.

export function monthRangeUTC(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));
  return { start, end };
}

// parseDateOnly là hàm chuyển đổi một chuỗi ngày (value) sang đối tượng Date. Chuỗi ngày được mong đợi ở định dạng "YYYY-MM-DD". Hàm này tạo ra một đối tượng Date mới từ chuỗi và trả về nó.

export function parseDateOnly(value: string): Date {
  return new Date(value);
}

// combineDateAndTime là hàm kết hợp một ngày (workDate) và một chuỗi giờ-phút (hhmm) thành một đối tượng Date duy nhất. Nó tách chuỗi hhmm thành giờ và phút, sau đó tạo ra một đối tượng Date mới với năm, tháng, ngày từ workDate và giờ, phút từ hhmm. Kết quả được điều chỉnh theo múi giờ Việt Nam (VN_TZ_OFFSET) để đảm bảo rằng thời gian được tính đúng theo giờ địa phương.

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

