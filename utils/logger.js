export function logError(...args) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error(...args);
  }
}
