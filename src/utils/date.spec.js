import test from 'tape';

import {dateTimeStringToTimestamp, dateTimeStringToDateString, timestampToDateTimeString} from './date';

test('date utils: dateTimeStringToTimestamp()', (t) => {
  t.equal(
    dateTimeStringToTimestamp('2020-01-16 22:49:11'),
    // 1579211351000, // TZ-offset: -60
    1579207751000, // TZ-offset: -120
    'converts a "YYYY-MM-DD HH:MM" string to a timestamp',
  );

  t.end();
});

test('date utils: dateTimeStringToDateString()', (t) => {
  t.equal(
    dateTimeStringToDateString('2020-01-16 22:49:11'),
    '2020-01-16',
    'returns a "YYYY-MM-DD" part from a "YYYY-MM-DD HH:MM" string',
  );

  t.end();
});

test('date utils: timestampToDateTimeString()', (t) => {
  t.equal(
    timestampToDateTimeString(1579207751000),
    // 'Jan 16 21:49', // TZ-offset: -60
    'Jan 16 22:49', // TZ-offset: -120
    'converts a timestamp to a "Mon DD HH:MM" string',
  );

  t.end();
});
