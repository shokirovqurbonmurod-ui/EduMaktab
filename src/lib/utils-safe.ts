// Re-exports of the client-safe utilities used across pages.
// (Kept in a separate module so pages don't import React-only helpers
// from the generic utils in ways that could be tree-shaken oddly.)
import { useEffect, useState } from "react";
export {
  addDaysISO,
  clamp,
  formatDateShortUZ,
  formatDateUZ,
  formatMonthUZ,
  formatTimeUZ,
  formatNumber,
  formatPercent,
  formatUZS,
  formatUZSCompact,
  fullName,
  initials,
  MONTHS_UZ,
  MONTHS_UZ_SHORT,
  relativeDayUZ,
  todayISO,
  uid,
  weekdayOfISO,
  WEEKDAYS_UZ,
  WEEKDAYS_UZ_SHORT,
} from "./utils";

export function useDebouncedSafe<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}


