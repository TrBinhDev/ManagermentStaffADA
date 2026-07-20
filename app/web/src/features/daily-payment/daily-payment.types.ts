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

export interface AllPaymentsResult {
  data: PaymentSummaryEntry[];
  grandTotal: number;
}
