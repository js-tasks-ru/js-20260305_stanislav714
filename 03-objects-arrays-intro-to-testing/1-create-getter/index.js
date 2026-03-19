/**
 * createGetter - creates function getter which allows select value from object
 * @param {string} path - the strings path separated by dot
 * @returns {function} - function-getter which allow get value from object by set path
 */
export function createGetter(path) {
  if (!path.length) {
    return;
  }
  return (obj) => path.split(".").reduce((acc, key) => {
    if (!acc?.hasOwnProperty(key)) {
      return;
    }
    return acc?.[key];
  }, obj);
}
