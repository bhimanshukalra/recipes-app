/** Days are stored as local calendar dates, "2026-11-16", so they never shift with time zones. */
export type DateKey = string;

const pad = (value: number) => String(value).padStart(2, "0");

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: DateKey): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** The Monday of the week containing `key`. */
export function weekStart(key: DateKey): DateKey {
  const day = fromDateKey(key).getDay(); // 0 is Sunday
  return addDays(key, day === 0 ? -6 : 1 - day);
}

/** The seven days of the week that starts on `start`. */
export function weekDays(start: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** "Mon 16 Nov". */
export function formatDay(key: DateKey): string {
  return fromDateKey(key).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** "16–22 Nov", or "30 Nov – 6 Dec" when the week crosses a month. */
export function formatWeek(start: DateKey): string {
  const first = fromDateKey(start);
  const last = fromDateKey(addDays(start, 6));
  const month = (date: Date) => date.toLocaleDateString(undefined, { month: "short" });
  return first.getMonth() === last.getMonth()
    ? `${first.getDate()}–${last.getDate()} ${month(last)}`
    : `${first.getDate()} ${month(first)} – ${last.getDate()} ${month(last)}`;
}
