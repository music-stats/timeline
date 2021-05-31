export function url(strings, ...keys) {
  return fillTemplate((value) => encodeURIComponent(value).replace(/%20/g, '+'), strings, ...keys);
}

// @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates
function fillTemplate(transform, strings, ...keys) {
  return keys.reduce(
    (patternParts, key, index) => patternParts.concat(
      transform ? transform(key) : String(key),
      strings[index + 1],
    ),
    [strings[0]],
  ).join('');
}
