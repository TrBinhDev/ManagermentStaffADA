import { useCallback, useEffect, useState } from "react";
import * as positionSalaryRateApi from "./position-salary-rate.api";
import type { PositionSalaryRate } from "./position-salary-rate.types";

export function usePositionSalaryRates(positionId: string | null) {
  const [data, setData] = useState<PositionSalaryRate[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!positionId) return;
    setLoading(true);
    const result = await positionSalaryRateApi.fetchSalaryRates(positionId);
    setData(result);
    setLoading(false);
  }, [positionId]);

  useEffect(() => {
    if (!positionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- dong dialog thi reset ve rong, khong phai fetch
      setData([]);
      return;
    }
    refetch();
  }, [positionId, refetch]);

  return { data, loading, refetch };
}
