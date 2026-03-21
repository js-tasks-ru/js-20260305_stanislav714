/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size === 0) {
    return '';
  }
  if (!size || string.length <= size) {
    return string;
  }

  const result = [];
  let count = 0;
  let lastChar = '';

  for (const char of string) {
    if (char === lastChar) {
      count++;
    } else {
      count = 1;
      lastChar = char;
    }

    if (count <= size) {
      result.push(char);
    }
  }

  return result.join('');
}
