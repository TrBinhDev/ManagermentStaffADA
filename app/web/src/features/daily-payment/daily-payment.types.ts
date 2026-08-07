export interface DailyPaymentItem {
  id: string;
  employeeId: string;
  positionId: string;
  workDate: string;
  hoursWorked: string;
  hourlyRate: string;
  amount: string;
  position: { id: string; name: string };
}

export interface EmployeePaymentsResult {
  data: DailyPaymentItem[];
  totalAmount: number;
  totalHours: number;
}

export interface PaymentSummaryEntry {
  employeeId: string;
  fullName: string;
  totalAmount: number;
  totalHours: number;
}

// Kết quả của GET /payments - danh sách nhân viên kèm lương, có phân trang (KHÔNG có grandTotal)
export interface AllPaymentsResult {
  data: PaymentSummaryEntry[];
  total: number;
  page: number;
  limit: number;
}

// Kết quả của GET /payments/summary - tổng lương toàn nhà hàng, 1 con số duy nhất
export interface PaymentSummaryResult {
  grandTotal: number;
}
