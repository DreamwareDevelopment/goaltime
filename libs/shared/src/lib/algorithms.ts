export const binarySearchInsert = <T>(array: T[], item: T, compareFn: (a: T, b: T) => number): number => {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (compareFn(array[mid], item) < 0) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  array.splice(low, 0, item);
  return low
};
