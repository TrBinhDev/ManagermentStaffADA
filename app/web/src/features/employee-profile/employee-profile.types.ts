export interface EmployeeProfile {
  id: string;
  employeeId: string;
  cccd: string;
  gender: string | null;
  ethnicity: string | null;
  religion: string | null;
  permanentAddress: string | null;
  currentAddress: string | null;
  primaryPhone: string | null;
  email: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  maritalStatus: string | null;
  educationLevel: string | null;
  cccdIssueDate: string | null;
  cccdIssuePlace: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  avatarUrl: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertEmployeeProfileInput {
  cccd?: string;
  gender?: string;
  ethnicity?: string;
  religion?: string;
  permanentAddress?: string;
  currentAddress?: string;
  primaryPhone?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  maritalStatus?: string;
  educationLevel?: string;
  cccdIssueDate?: string;
  cccdIssuePlace?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  note?: string;
}
