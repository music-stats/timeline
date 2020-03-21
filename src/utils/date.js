const monthNameList = [
         'Jan', 'Feb',
  'Mar', 'Apr', 'May',
  'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov',
  'Dec',
];

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

export function timestampToDateTimeString(timestamp) {
  const date = new Date(timestamp);
  const monthName = monthNameList[date.getMonth()];
  const [day, hours, mins] = [
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
  ].map((value) => value.toString().padStart(2, '0'));

  return `${monthName} ${day} ${hours}:${mins}`;
}
