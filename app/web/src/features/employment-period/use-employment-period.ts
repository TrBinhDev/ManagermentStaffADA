import { useEffect, useState } from "react";
import * as employmentPeriodApi from "./employment-period.api";
import type { EmploymentPeriodItem } from "./employment-period.types";

export function useEmploymentPeriods(employeeId: string) {
  const [data, setData] = useState<EmploymentPeriodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, loading da mac dinh true nhung can reset lai khi employeeId doi
    setLoading(true);
    employmentPeriodApi.fetchEmploymentPeriods(employeeId).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [employeeId]);

  return { data, loading };
}
