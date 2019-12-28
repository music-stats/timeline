export function dateTimeStringToTimestamp(dateTimeString) {
  // The "T" is getting inserted between "YYYY-MM-DD" and "HH:MM"
  // to avoid "invalid date" errors in mobile browsers.
  // @see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
  return Date.parse(dateTimeString.replace(' ', 'T'));
}

export function dateTimeStringToDateString(dateTimeString) {
  // "YYYY-MM-DD"
  return dateTimeString.slice(0, 10);
}
