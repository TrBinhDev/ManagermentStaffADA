import { useEffect, useState } from "react";
import * as positionHistoryApi from "./position-history.api";
import type { PositionHistoryItem } from "./position-history.types";

export function usePositionHistory(employeeId: string) {
  const [data, setData] = useState<PositionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, loading da mac dinh true nhung can reset lai khi employeeId doi
    setLoading(true);
    positionHistoryApi.fetchPositionHistory(employeeId).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [employeeId]);

  return { data, loading };
}
