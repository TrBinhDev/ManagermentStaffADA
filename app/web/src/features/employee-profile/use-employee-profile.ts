import { useCallback, useEffect, useState } from "react";
import * as employeeProfileApi from "./employee-profile.api";
import type { EmployeeProfile } from "./employee-profile.types";

// Chi dung o dung 1 cho (tab "Ho so" trong trang chi tiet nhan vien) nen khong can
// zustand store rieng - tu fetch, tu render.
export function useEmployeeProfile(employeeId: string) {
  const [data, setData] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const result = await employeeProfileApi.fetchProfile(employeeId);
    setData(result);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, refetch tu setState ben trong
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}
