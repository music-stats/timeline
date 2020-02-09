export function createProxyMethod(decorator, decorated) {
  return (method) => (decorator[method] = (...args) => decorated[method].apply(decorated, args));
}
