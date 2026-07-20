import { useCallback, useEffect, useState } from "react";
import * as capacityApi from "./shift-position-capacity.api";
import type { ShiftPositionCapacity } from "./shift-position-capacity.types";

export function useShiftPositionCapacities(shiftId: string | null) {
  const [data, setData] = useState<ShiftPositionCapacity[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!shiftId) return;
    setLoading(true);
    const result = await capacityApi.fetchCapacities(shiftId);
    setData(result);
    setLoading(false);
  }, [shiftId]);

  useEffect(() => {
    if (!shiftId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- dong dialog thi reset ve rong, khong phai fetch
      setData([]);
      return;
    }
    refetch();
  }, [shiftId, refetch]);

  return { data, loading, refetch };
}
