export function dateStringToTimestamp(dateString) {
  // The "T" is getting inserted between "YYYY-MM-DD" and "HH:MM"
  // to avoid "invalid date" errors in mobile browsers.
  // @see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
  return Date.parse(dateString.replace(' ', 'T'));
}
