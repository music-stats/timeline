export function dateStringToTimestamp(dateString) {
  return (new Date(dateString)).getTime();
}
