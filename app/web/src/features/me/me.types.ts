// Subset cua UpsertEmployeeProfileInput - khong co cccd/cccdIssueDate/cccdIssuePlace/note,
// khop dung voi meUpdateProfileSchema ben server (nhung field nay chi admin duoc sua).
export interface MeUpdateProfileInput {
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
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
}

export interface MeAttendanceParams {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
