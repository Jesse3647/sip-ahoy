/** Date presentation helpers; stored sailing dates and ISO timestamps have different roles. */
/** Formats a date-only YYYY-MM-DD value at local noon to avoid UTC-midnight date shifts. */
export const dateLabel = (s: string) =>
  new Date(s + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
/** Returns the device-local calendar date, independent of UTC day boundaries. */
export const localDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
