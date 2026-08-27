/**
 * Returns today's date as "YYYY-MM-DD" string in America/Los_Angeles timezone.
 * Uses toLocaleDateString('en-CA') which outputs ISO format directly,
 * avoiding the timezone trap of new Date(toLocaleString()).
 */
export function getLADateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

/**
 * Returns a Date object set to midnight in LA timezone.
 * Useful for week calculations where a Date object is needed.
 */
export function getLAToday() {
  const parts = getLADateString().split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}
