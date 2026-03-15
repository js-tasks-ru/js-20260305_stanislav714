/**
 * pick - Creates an object composed of the picked object properties:
 * @param {object} obj - the source object
 * @param {...string} fields - the properties paths to pick
 * @returns {object} - returns the new object
 */
export const pick = (obj, ...fields) => {
  return Object.keys(obj).reduce((acc, k) => {
    if (fields.includes(k)) {
      acc[k] = obj[k];
    }
    return acc;
  }, {});
};
