/** Formats a Date using its local calendar fields, as YYYY-MM-DD. */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Device-local today, as YYYY-MM-DD. */
export function todayStr(): string {
  return toDateStr(new Date());
}

/** First day of the device-local current month, as YYYY-MM-DD. */
export function monthStartStr(): string {
  const now = new Date();
  return toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
}

/** Device-local date `n` days before today, as YYYY-MM-DD. */
export function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}
